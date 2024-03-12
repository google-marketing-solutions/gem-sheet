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

const addAuth = params => Object.assign({ payload: JSON.stringify(params) }, {
  'method': 'POST',
  'contentType': 'application/json',
  'muteHttpExceptions': true,
  'headers': {
    'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`,
  }
});

const fetchJson = (url, params) => {
  const text = UrlFetchApp.fetch(url, params).getContentText();
  let res = undefined;
  try {
    res = JSON.parse(text);
  } catch (e) {
    alert(`Response is not valid JSON:\n${text}`);
  }
  if (res?.error) {
    console.log({ url, params });
    const prompt = res?.error.message || JSON.stringify(res?.error, null, 2);
    alert(prompt);
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
const gemini = config => prompt => {
  const serviceUrl = `https://${config.endpoint}/v1/projects/${config.projectID}/locations/${config.location}/publishers/google/models/${config.modelID}:streamGenerateContent`
  const res = fetchJson(serviceUrl, addAuth({
    "contents": [{
      "role": "user",
      "parts": [{ "text": prompt }]
    }],
    "generation_config": {
      "temperature": config.temperature || 0.4,
      "topP": config.topP || 1.,
      "topK": 32,
      "maxOutputTokens": config.maxOutputTokens || 2048
    }
  }));
  return res?.map(r => r.candidates?.[0].content?.parts?.[0].text).join('');
}

const generateImage = (endpoint, projectId, modelId) => (prompt, sampleCount = 1) => {
  const serviceUrl = `https://${endpoint}/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:predict`;
  const payload = {
    'instances': [{ prompt }],
    'parameters': { sampleCount }
  };
  const res = fetchJson(serviceUrl, addAuth(payload));
  return res.predictions?.map(e => e.bytesBase64Encoded)[0];
}
