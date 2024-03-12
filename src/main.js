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

const SKIP_HEADER_ROWS = 1;
const RESPONSE_COLUMN_INDEX = 2;
const RESPONSE_RANGE_PREFIX_TEXT = 'AI_TEXT';
const RESPONSE_RANGE_PREFIX_IMAGES = 'AI_IMAGE';

const processPrompts = (promptHandler, regenerateResult, allSheets, rangePrefix, resultTransformer = null) => {
  const ranges = allSheets
    ? SpreadsheetApp.getActiveSpreadsheet().getNamedRanges()
    : SpreadsheetApp.getActiveSheet().getNamedRanges();
  ranges
    .filter(namedRange => namedRange.getName().startsWith(rangePrefix))
    .forEach(range => {
      const promptResultValues = range.getRange().getValues();
      console.log(`Handling range ${range.getName()}`);
      promptResultValues.map((values, index) => {
        const prompt = values[0];
        const previousResult = values[values.length - 1];
        if (prompt !== '' && (previousResult === '' || regenerateResult)) {
          const result = promptHandler(prompt);
          const resultCell = range.getRange().getCell(index + 1, values.length);
          console.log("would override " + resultCell.getValue());
          resultCell.setValue(resultTransformer ? resultTransformer(result) : result);
          SpreadsheetApp.flush(); // to instantly show results
          console.log({ prompt, previousResult, result });
        } else {
          console.log(`skipping existing result ${previousResult}`)
        }
      })
    });
}

const creatCellImageForBase64 = base64Data => SpreadsheetApp
  .newCellImage()
  .setSourceUrl(`data:image/png;base64,${base64Data}`)
  .build();

const generate = (regenerateResult, allSheets) => {
  const config = getConfig();

  const textGenerator = gemini({ endpoint: config.endpoint, projectID: config.project, modelID: config.textModel, location: "us-central1" });
  const imageGenerator = generateImage(config.endpoint, config.project, config.imageModel);

  processPrompts(textGenerator, regenerateResult, allSheets, RESPONSE_RANGE_PREFIX_TEXT);
  processPrompts(imageGenerator, regenerateResult, allSheets, RESPONSE_RANGE_PREFIX_IMAGES, creatCellImageForBase64);
}
