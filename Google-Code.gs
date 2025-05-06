function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "success", message: "GET not supported" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheetName = 'Tasks';
  var scriptProp = PropertiesService.getScriptProperties();
  var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
  var sheet = doc.getSheetByName(sheetName);
  Logger.log("sheet is %s",sheet.getSheetName());
  var params = JSON.parse(e.postData.contents);

  if (params.token !== 'g[6e=Rh,Y>7<b+Xk9n$TV') {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid token' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (params.action === 'updateStatus') {
    var taskId = parseInt(params.taskId);
    var rowIndex = findRowById(sheet, headers, taskId);
    Logger.log("update status rowindex = %s",rowIndex);
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Task not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    sheet.getRange(rowIndex, headers.indexOf('status') + 1).setValue(params.status);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (params.action === 'updateTask') {
    var taskId = parseInt(params.taskId);
    var rowIndex = findRowById(sheet, headers, taskId);
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Task not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    sheet.getRange(rowIndex, headers.indexOf('title') + 1).setValue(params.title);
    sheet.getRange(rowIndex, headers.indexOf('description') + 1).setValue(params.description || '');
    sheet.getRange(rowIndex, headers.indexOf('subject') + 1).setValue(params.subject);
    sheet.getRange(rowIndex, headers.indexOf('duration') + 1).setValue(parseInt(params.duration));
    sheet.getRange(rowIndex, headers.indexOf('resources') + 1).setValue(params.resources || '');
    sheet.getRange(rowIndex, headers.indexOf('cloudId') + 1).setValue(params.cloudId);
    sheet.getRange(rowIndex, headers.indexOf('status') + 1).setValue(params.status || 'not_started');
    sheet.getRange(rowIndex, headers.indexOf('scheduledDate') + 1).setValue(params.scheduledDate);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (params.action === 'addTask') {
    var newId = sheet.getLastRow();
    sheet.appendRow([
      newId,
      params.title,
      params.description || '',
      params.subject,
      parseInt(params.duration),
      params.resources || '',
      params.cloudId,
      params.status || 'not_started',
      params.scheduledDate
    ]);
    return ContentService.createTextOutput(JSON.stringify({ success: true, newId }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (params.action === 'deleteTask') {
    var taskId = parseInt(params.taskId);
    var rowIndex = findRowById(sheet, headers, taskId);
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Task not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    sheet.deleteRow(rowIndex);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (params.action === 'syncTasks') {
    // Implement sync logic if needed
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function findRowById(sheet, headers, taskId) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (parseInt(data[i][headers.indexOf('id')]) === taskId) {
      return i + 1;
    }
  }
  return -1;
}

function setup() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('key', doc.getId());
}