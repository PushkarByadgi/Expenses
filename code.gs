/**
 * Handles POST requests from the expense tracker web app, logs data to Google Sheets.
 * Also handles GET requests to fetch the last 10 entries.
 * 
 * Instructions:
 * 1. Ensure your Google Sheet tab name matches SHEET_NAME.
 * 2. Sheet columns: Date | Month | Year | Amount | Description | Type
 * 3. Deploy as Web App (execute as Me, access: Anyone).
 * 4. Use the Web App URL in your HTML config.
 * 
 * @OnlyCurrentDoc
 */

// --- Configuration ---
var SHEET_NAME = "Expenses"; // <<< CONFIRM THIS MATCHES YOUR SHEET TAB NAME!
var SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
var SHEET = SPREADSHEET.getSheetByName(SHEET_NAME);

// --- Main Function (Handles POST requests from the web app) ---
function doPost(e) {
  var response = { status: "error", message: "Unknown error during script execution." };

  try {
    if (!SHEET) {
      Logger.log("Script configuration error: Sheet named '" + SHEET_NAME + "' was not found in spreadsheet '" + SPREADSHEET.getName() + "'.");
      throw new Error("Configuration Error: Target sheet '" + SHEET_NAME + "' not found.");
    }
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received in the request.");
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (jsonError) {
      Logger.log("Failed to parse incoming JSON: " + e.postData.contents + "\nError: " + jsonError);
      throw new Error("Invalid data format received.");
    }

    if (data.amount == null || typeof data.amount !== 'number' || data.amount <= 0) {
        throw new Error("Missing or invalid 'amount'. Must be a positive number.");
    }
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === "") {
        throw new Error("Missing or invalid 'description'. Cannot be empty.");
    }
    if (!data.types || !Array.isArray(data.types) || data.types.length === 0) {
        throw new Error("Missing or invalid 'types'. At least one category must be selected.");
    }

    const now = new Date();
    const scriptTimeZone = Session.getScriptTimeZone();
    const formattedDate = Utilities.formatDate(now, scriptTimeZone, "dd/MM/yyyy");
    const monthName = Utilities.formatDate(now, scriptTimeZone, "MMMM");
    const year = now.getFullYear();

    var rowData = [
      formattedDate,             // Date (dd/MM/yyyy)
      monthName,                 // Month
      year,                      // Year (yyyy)
      data.amount,               // Amount
      data.description.trim(),   // Description
      data.types.join(', ')      // Types (comma-separated)
    ];

    SHEET.insertRowAfter(1);
    SHEET.getRange(2, 1, 1, rowData.length).setValues([rowData]);
    SHEET.getRange(2, 3).setNumberFormat("0");

    response.status = "success";
    response.message = "Expense logged successfully.";

  } catch (error) {
    Logger.log("Error in doPost: " + error.message + "\nStack: " + error.stack);
    if (e && e.postData && e.postData.contents) { Logger.log("Data received during error: " + e.postData.contents); }
    response.status = "error";
    response.message = "Failed to log expense: " + error.message;
  }

  return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
}

// --- Fetch last 10 entries as JSON (GET request) ---
function doGet(e) {
  var response = { status: "error", message: "Unknown error." };
  try {
    if (!SHEET) throw new Error("Sheet not found.");
    var lastRow = SHEET.getLastRow();
    if (lastRow < 2) {
      // No data
      response.status = "success";
      response.entries = [];
    } else {
      var numRows = Math.min(10, lastRow - 1);
      var data = SHEET.getRange(2, 1, numRows, 6).getValues(); // 6 columns: Date, Month, Year, Amount, Description, Type
      response.status = "success";
      response.entries = data;
    }
  } catch (err) {
    response.status = "error";
    response.message = err.message;
  }
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Optional Test Function ---
function testSheetAccess() {
  var testSheetName = SHEET_NAME;
  if (!SPREADSHEET) { Logger.log("Error: Could not get active spreadsheet."); return; }
  Logger.log("Attempting to access spreadsheet: " + SPREADSHEET.getName() + " (ID: " + SPREADSHEET.getId() + ")");
  Logger.log("Looking for sheet named: '" + testSheetName + "'");
  var sheet = SPREADSHEET.getSheetByName(testSheetName);
  if (sheet) {
    Logger.log("SUCCESS: Found sheet '" + testSheetName + "'. ID: " + sheet.getSheetId() + ", Index: " + sheet.getIndex() + ", Last Row: " + sheet.getLastRow() + ", Last Col: " + sheet.getLastColumn());
  } else {
    Logger.log("FAILURE: Could NOT find sheet named '" + testSheetName + "'.");
    var allSheets = SPREADSHEET.getSheets(); var sheetNames = allSheets.map(function(s) { return "'" + s.getName() + "'"; });
    Logger.log("Available sheets: " + sheetNames.join(", "));
  }
}
