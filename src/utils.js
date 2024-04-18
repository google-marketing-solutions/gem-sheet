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

const isNonEmptyRow = row => row.join('').length > 0

const getNonEmptyRows = sheet =>
  sheet.getDataRange().getValues().filter(isNonEmptyRow);

const truncateRows = (sheet, headerRows) => {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  if (lastRow > headerRows) {
      sheet.getRange(headerRows + 1, 1, lastRow - headerRows, lastColumn).clearContent();
  }
}

const appendRows = (sheet, data, startRow = 1) => {
  var numRows = data.length;
  var numColumns = data[0].length;
  var range = sheet.getRange(startRow, 1, numRows, numColumns);

  range.setValues(data);
}

const writeRowsToSheet = (sheet, data, headerRows) => {
  truncateRows(sheet, headerRows);
  appendRows(sheet, data, headerRows);
}

const getScriptProperties = key =>
  PropertiesService.getScriptProperties().getProperty(key)

const setScriptProperties = (key, value) =>
  PropertiesService.getScriptProperties().setProperty(key, value);

  function* generateCartesianProduct(a, b) {
    for (const rowA of a) {
        for (const rowB of b) {
            yield [...rowA, ...rowB];
        }
    }
}

const getRangesForPrefix = (sheet, prefix) => sheet.getNamedRanges()
  .filter(namedRange => namedRange.getName().startsWith(prefix));

const getCellsFromRange = range => {
  const cells = [];
  for (let i = 1; i <= range.getNumRows(); i++) {
    const row = [];
    for (let j = 1; j <= range.getNumColumns(); j++) {
      row.push(range.getCell(i, j));
    }
    cells.push(row);
  }
  return cells;
}

const CARTESIAN_PRODUCT = (a, b) =>
  [...generateCartesianProduct(a.filter(isNonEmptyRow), b.filter(isNonEmptyRow))];

const trying = func => {
  try {
    return func();
  } catch (e) {
    return undefined;
  }
}

const alert = prompt => {
  const ui = trying(() => SpreadsheetApp.getUi());
  if (ui) {
    SpreadsheetApp.getUi().alert(prompt);
  } else {
    console.log(prompt);
  }
}
