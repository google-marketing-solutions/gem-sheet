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
const onOpen = () => {
  SpreadsheetApp.getUi()
    .createMenu('⭐ AI Sheet ⭐')
    .addItem('Activate Sidebar', showConfigSidebar.name)
    .addItem('Generate missing', generateMissingHere.name)
    .addItem('Generate all (override exsisting)', generateAllHere.name)
    .addToUi();
}

const generateAllHere = () => { generate(true,  false); }
const generateMissingHere = () => { generate(false, false); }

const showConfigSidebar = () => {
  const html = HtmlService.createTemplateFromFile('sidebar').evaluate();
  html.setTitle(' ');
  SpreadsheetApp.getUi().showSidebar(html);  
}

const defaultConfig = {
  endpoint: 'us-central1-aiplatform.googleapis.com', 
  project: '<YOUR_CLOUD_PROJECT_ID_HERE>',
  textModel: 'text-bison',
  imageModel: 'imagegeneration'
}

const getConfig = () =>
  JSON.parse(getScriptProperties('config')) || defaultConfig;

const saveConfig = config =>
  setScriptProperties('config', JSON.stringify(config));