/**
 * Handles POST requests from the expense tracker web app, logs data to Google Sheets.
 * Corrected Version: Ensures 4-digit year in date string and matches the specified column order.
 *
 * Instructions:
 * 1. VERY IMPORTANT: Ensure your Google Sheet tab name exactly matches the SHEET_NAME variable below.
 * 2. CRITICAL: Ensure your Google Sheet columns are *exactly* in this order:
 *    Column A: Date (will receive dd/MM/yyyy)
 *    Column B: Month (will receive full month name)
 *    Column C: Year (will receive yyyy)
 *    Column D: Amount (will receive the number)
 *    Column E: Description (will receive the text)
 *    Column F: Type (will receive comma-separated types)
 * 3. Deploy/Re-deploy this script as a Web App (Deploy > Manage deployments > Edit > New version > Deploy):
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Use the resulting Web App URL in your index.html configuration.
 *
 * @OnlyCurrentDoc Limits the script to only accessing the spreadsheet it is bound to.
 */

// --- Configuration ---
var SHEET_NAME = "Expenses"; // <<< CONFIRM THIS MATCHES YOUR SHEET TAB NAME!
var SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
var SHEET = SPREADSHEET.getSheetByName(SHEET_NAME);

// --- Main Function (Handles POST requests from the web app) ---
function doPost(e) {
  var response = { status: "error", message: "Unknown error during script execution." };

  try {
    // --- Initial Checks ---
    if (!SHEET) {
      Logger.log("Script configuration error: Sheet named '" + SHEET_NAME + "' was not found in spreadsheet '" + SPREADSHEET.getName() + "'.");
      throw new Error("Configuration Error: Target sheet '" + SHEET_NAME + "' not found.");
    }
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received in the request.");
    }

    // --- Parse Incoming Data ---
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (jsonError) {
      Logger.log("Failed to parse incoming JSON: " + e.postData.contents + "\nError: " + jsonError);
      throw new Error("Invalid data format received.");
    }

    // --- Validate Received Data ---
    // Ensure all expected fields exist and have roughly the correct type
    if (data.amount == null || typeof data.amount !== 'number' || data.amount <= 0) {
        throw new Error("Missing or invalid 'amount'. Must be a positive number.");
    }
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === "") {
        throw new Error("Missing or invalid 'description'. Cannot be empty.");
    }
    if (!data.types || !Array.isArray(data.types) || data.types.length === 0) {
        throw new Error("Missing or invalid 'types'. At least one category must be selected.");
    }

    // --- Generate Date/Time Components ---
    const now = new Date();
    const scriptTimeZone = Session.getScriptTimeZone();
    // Corrected date format to include 4-digit year
    const formattedDate = now; // Insert the Date object directly
    const monthName = Utilities.formatDate(now, scriptTimeZone, "MMMM");
    const year = Utilities.formatDate(now, scriptTimeZone, "yyyy");

    // --- Prepare Row Data for Sheet ---
    // IMPORTANT: This order MUST match your Google Sheet columns (A, B, C, D, E, F)
    var rowData = [
      formattedDate,             // Column A: Date (as Date object)
      monthName,                 // Column B: Month Name
      year,                      // Column C: Year (yyyy)
      data.amount,               // Column D: Amount
      data.description.trim(),   // Column E: Description
      data.types.join(', ')      // Column F: Types (comma-separated)
    ];
    // --- Insert Data at the Top of the Sheet ---
    Logger.log("Attempting to insert row data at top: " + JSON.stringify(rowData) + " to sheet: " + SHEET_NAME);
    SHEET.insertRowAfter(1);
    SHEET.getRange(2, 1, 1, rowData.length).setValues([rowData]);
    Logger.log("Row inserted successfully at the top.");

    // --- Set Success Response ---
    response.status = "success";
    response.message = "Expense logged successfully.";

  } catch (error) {
    // --- Error Handling ---
    Logger.log("Error in doPost: " + error.message + "\nStack: " + error.stack);
    if (e && e.postData && e.postData.contents) { Logger.log("Data received during error: " + e.postData.contents); }
    response.status = "error";
    response.message = "Failed to log expense: " + error.message;
  }

  // --- Return Response ---
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
