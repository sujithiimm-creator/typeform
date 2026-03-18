function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Get headers (assume row 1)
    var headersRange = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
    var headers = headersRange.getValues()[0];
    
    // Ensure Timestamp is first column if empty
    if (headers.length === 0 || headers[0] === "") {
      headers[0] = "Timestamp";
      sheet.getRange(1, 1).setValue("Timestamp");
    }
    
    // Check missing headers and add them
    for (var key in data) {
      if (headers.indexOf(key) === -1) {
        headers.push(key);
        sheet.getRange(1, headers.length).setValue(key);
      }
    }
    
    // Build row
    var row = new Array(headers.length).fill("");
    row[0] = new Date(); // Timestamp
    
    for (var key in data) {
      var colIndex = headers.indexOf(key);
      if (colIndex !== -1) {
        row[colIndex] = data[key];
      }
    }
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
