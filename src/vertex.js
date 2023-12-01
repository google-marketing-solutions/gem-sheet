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
  'headers': {
   'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`,
  }
};

const addAuth = params => Object.assign({payload: JSON.stringify(params)}, baseParams);
const fetchJson = (url, params) => JSON.parse(UrlFetchApp.fetch(url, params).getContentText());

const predict = (endpoint, projectId, modelId) => prompt => { 
 const serviceUrl = `https://${endpoint}/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:predict`;
 console.log(`Promt: ${prompt}`)
 Utilities.sleep(1000); // respsect rate limits (max 1 qps)
 const res = fetchJson(serviceUrl, addAuth({
   "instances": [ { "content": prompt} ],
   "parameters": {
     "temperature": 0,         
     "maxOutputTokens": 1024,
     "topP": 0.8,              
     "topK": 1
   } 
 }));
 console.log(JSON.stringify(res, null, 2));
 return res.predictions[0].content.trim();
}


const generateImage = (endpoint, projectId, modelId) => (prompt, sampleCount = 1, sampleImageSize = '1024') => {
   const serviceUrl = `https://${endpoint}/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:predict`;
   const payload = addAuth({
     'instances': [{ prompt}],
     'parameters': {
       sampleImageSize,
       sampleCount
     }
   });
   console.log(payload);
   const res = fetchJson(serviceUrl, payload);
   console.log(JSON.stringify(res, null, 2));
   return res.predictions?.map(e => e.bytesBase64Encoded)[0];
 }
