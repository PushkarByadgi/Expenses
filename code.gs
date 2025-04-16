/**
 * @OnlyCurrentDoc
 */

// --- Configuration ---
var SHEET_NAME = "Expenses"; // <--- MAKE SURE THIS MATCHES YOUR SHEET TAB NAME
var SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
var SHEET = SPREADSHEET.getSheetByName(SHEET_NAME);

// --- Main Function (Handles POST requests) ---
function doPost(e) {
  var response = { status: "error", message: "Unknown error" };

  try {
    if (!SHEET) { /* Keep sheet check */ }
    if (!e || !e.postData || !e.postData.contents) { /* Keep data check */ }

    var data;
    try { /* Keep JSON parse */
      data = JSON.parse(e.postData.contents);
    } catch (jsonError) { /* Keep JSON error handling */ }

    // --- START: SIMPLIFIED VALIDATIONS ---
    // Validate only the fields received from the client
    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      throw new Error("Missing or invalid 'amount'. Must be a positive number.");
    }
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === "") {
      throw new Error("Missing or invalid 'description'. Must be a non-empty string.");
    }
    if (!data.types || !Array.isArray(data.types) || data.types.length === 0) {
      throw new Error("Missing or invalid 'types'. Must be a non-empty array.");
    }
    // NO validation needed for date/month as they are generated here
    // --- END: SIMPLIFIED VALIDATIONS ---

    // --- START: GENERATE DATE & MONTH NAME IN SCRIPT ---
    const now = new Date();
    // Use Utilities.formatDate for robust formatting respecting spreadsheet timezone
    const formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yy");
    const monthName = Utilities.formatDate(now, Session.getScriptTimeZone(), "MMMM"); // "MMMM" gives full month name
    // --- END: GENERATE DATE & MONTH NAME IN SCRIPT ---


    // --- MODIFIED ROW DATA ---
    // Prepare row data using generated date/month and client data
    // !!! ADJUST THE ORDER TO MATCH YOUR GOOGLE SHEET COLUMNS !!!
    var rowData = [
      formattedDate,             // Column 1: Date (DD/MM/YY generated here)
      monthName,                 // Column 2: Month (Name generated here)
      data.amount,               // Column 3: Amount (from client)
      data.description.trim(),   // Column 4: Description (from client)
      data.types.join(', ')      // Column 5: Types (from client)
    ];
    // --- END MODIFIED ROW DATA ---


    // --- Keep Logging and Append ---
    Logger.log("Attempting to append row data: " + JSON.stringify(rowData));
    SHEET.appendRow(rowData);
    Logger.log("Row appended successfully.");
    // --- Keep Logging and Append ---


    // Set success response (keep as is)
    response.status = "success";
    response.message = "Expense logged successfully.";

  } catch (error) { /* Keep error handling */ }

  // Return the response as JSON (keep as is)
  return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
}

// --- Test Function (Optional - keep for diagnostics) ---
// function testSheetAccess() { ... } // No changes needed here
