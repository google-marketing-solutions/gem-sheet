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
const RESPONSE_RANGE_PREFIX_MULTIMODAL = 'AI_MULTI';

const processPrompts  = (promptHandler, regenerateResult, allSheets, rangePrefix, resultTransformer = null) => {
  const ranges = allSheets
    ? SpreadsheetApp.getActiveSpreadsheet().getNamedRanges()
    : SpreadsheetApp.getActiveSheet().getNamedRanges();
  ranges
    .filter(namedRange => namedRange.getName().startsWith(rangePrefix))
    .forEach(namedRange => {
      const cells = getCellsFromRange(namedRange.getRange());
      console.log(`Handling range ${namedRange.getName()}`);
      cells.forEach(row => {
        const prompt = row[0].getValue();
        const previousResult = row[row.length - 1].getValue();
        if (prompt !== '' && (previousResult === '' || regenerateResult)) {
          const result = promptHandler(prompt, row.slice(0, -1));
          if (result) {
            const resultCell = row[row.length - 1];
            console.log("would override " + resultCell.getValue());
            resultCell.setValue(resultTransformer ? resultTransformer(result) : result);
            SpreadsheetApp.flush(); // to instantly show results
            console.log({prompt, previousResult, result});
          }
        } else {
          console.log(`skipping existing result ${previousResult}`)
        }
      })
    });
}

const createCellImageForBase64 = base64Data => SpreadsheetApp
  .newCellImage()
  .setSourceUrl(`data:image/png;base64,${base64Data}`)
  .build();

const cellToPart = cell => {
  let imageUrl;

  if (cell.getFormula().startsWith('=IMAGE(')) {
    const formula = cell.getFormula();
    imageUrl = formula.match(/=IMAGE\((.*?)\)/)[1];
    console.log(`imageUrl ==> ${imageUrl}`)
    if (imageUrl.startsWith('"') && imageUrl.endsWith('"')) {
      imageUrl = imageUrl.slice(1, -1); // remove string quotes
    } else {
      imageUrl = cell.getSheet().getRange(imageUrl).getValue();
    }
  }

  if (imageUrl) {
    console.log(`found image URL: ${imageUrl}`)
    const imageData = UrlFetchApp.fetch(imageUrl).getBlob().getBytes();
    const base64Image  = Utilities.base64Encode(imageData);
    return createImageContentPart(base64Image);
  } else if (cell.getValue().length > 0) {
    return createATextPromptPart(cell.getValue());
  } else {
    return undefined
  }
}
const nonEmptyCell = cell => {
  const value = cell.getValue();
  return value?.length > 0 || cell.getFormula().length > 0;
}

const generate = (regenerateResult, allSheets) => {
  const config = getConfig();

  const textGenerator = gemini({endpoint: config.endpoint, projectID: config.project, modelID: config.textModel, location: "us-central1"});
  const imageGenerator = generateImage(config.endpoint, config.project, config.imageModel);
  const multiModal = geminiRequest({endpoint: config.endpoint, projectID: config.project, modelID: config.textModel, location: "us-central1"})

  processPrompts(textGenerator, regenerateResult, allSheets, RESPONSE_RANGE_PREFIX_TEXT);
  processPrompts(imageGenerator, regenerateResult, allSheets, RESPONSE_RANGE_PREFIX_IMAGES, createCellImageForBase64);
  processPrompts((_, cells) => {
    const parts = cells.filter(nonEmptyCell).map(cellToPart).filter(part => part !== undefined);
    return parts.length > 0 ? multiModal(parts) : null;
  }, regenerateResult, allSheets, RESPONSE_RANGE_PREFIX_MULTIMODAL);
}
