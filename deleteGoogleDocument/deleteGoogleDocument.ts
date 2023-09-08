import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { google } from "googleapis";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Initialize the Google Drive API client
  const auth = new google.auth.JWT(
    process.env.SERVICE_ACCOUNT_EMAIL,
    undefined,
    process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ["https://www.googleapis.com/auth/drive"]
  );

  // Initialize the Google Drive API client
  const drive = google.drive({ version: "v3", auth });

  // Extract the file ID from the event body
  const body = JSON.parse(event.body || "{}");
  const fileId = body.fileId;

  if (!fileId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "File ID is required" }),
    };
  }

  try {
    // Delete the Google Document
    await drive.files.delete({ fileId });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Document deleted successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete document" }),
    };
  }
};
