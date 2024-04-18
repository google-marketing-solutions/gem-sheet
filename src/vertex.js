/*
Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const baseParams = {
  'method': 'POST',
  'contentType': 'application/json',
  'muteHttpExceptions': true,
  'headers': {
   'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`,
  }
};

const addAuth = params => Object.assign({payload: JSON.stringify(params)}, {
  'method': 'POST',
  'contentType': 'application/json',
  'muteHttpExceptions': false,
  'headers': {
   'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`,
  }
});

const fetchJson = (url, params) => {
 let res = undefined;
 try {
   const text = UrlFetchApp.fetch(url, params).getContentText();
   res = JSON.parse(text);
 } catch (err) {
   alert(err);
   throw err;
 }
 return res;
}

/**
* @typedef {Object} GeminiConfig
* @property {string} endpoint - The API Endpoint
* @property {string} projectID - GCP Project ID with Vertex AI enabled
* @property {string} location - Location of the prediction model
* @property {string} modelID - ID of the prediction model to use (e.g. gemini-pro)
* @property {number} temperature - Degree of randomness in token selection (0 is deterministic, 1 max randomness, default for gemini-pro-vision: 0.4)
* @property {number} topP - Lower value for less randomness. Range: 0.0 - 1.0, Default: 1.0
* @property {number} topK - Lower value for less randomness. Range: 1-40. Default for gemini-pro: none
* @property {number} maxOutputTokens - Default gemini-pro-vision: 2048
*/

/**
* @param {GeminiConfig} config
*/
const gemini = config => prompt =>
 geminiRequest(config)([createATextPromptPart(prompt)]);

/**
* @param {GeminiConfig} config
*/
const geminiRequest = config => parts => {
 const serviceUrl = `https://${config.endpoint}/v1/projects/${config.projectID}/locations/${config.location}/publishers/google/models/${config.modelID}:streamGenerateContent`
 const res = fetchJson(serviceUrl, addAuth({
   "contents": [{
       "role": "user",
       parts
     }],
   "generation_config": {
       "temperature": config.temperature || 0.4,
       "topP": config.topP || 1.,
       "topK": config.topK || 32,
       "maxOutputTokens": config.maxOutputTokens || 2048
   }
 }));
 return res?.map(r => r.candidates?.[0].content?.parts?.[0].text).join('');
}

const createATextPromptPart = prompt => ({ "text": prompt });

const createImageContentPart = base64Image => ({
 inlineData : {
   "mimeType": "image/png",
   "data": base64Image
 }
});

 const generateImage = (endpoint, projectId, modelId) => prompt => {
   const serviceUrl = `https://${endpoint}/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:predict`;
   const payload = {
     'instances': [{ prompt}],
     'parameters': {"sampleCount": 1}
   };
   const res = fetchJson(serviceUrl, addAuth(payload));
   return res.predictions?.map(e => e.bytesBase64Encoded)[0];
 }
