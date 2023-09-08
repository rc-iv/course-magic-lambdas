import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { google } from "googleapis";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Initialize the Drive API client
  const auth = new google.auth.JWT(
    process.env.SERVICE_ACCOUNT_EMAIL,
    undefined,
    process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/drive"]
  );

  // Initialize the Drive API client
  const drive = google.drive({ version: "v3", auth });

  // Extract file name and content from the event
  const { fileName, content } = event;
  console.log(`fileName: ${fileName}`);
  console.log(`content: ${content}`);

  try {
    // Step 1: Create a new Google Document with the given name
    console.log("Creating document");
    const createResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: "application/vnd.google-apps.document",
      },
      fields: "id",
    });

    console.log(
      `Created document with response: ${JSON.stringify(createResponse)}`
    );
    const fileId = createResponse.data.id;

    console.log(`File ID: ${fileId}`);
    if (!fileId) {
      throw new Error("Failed to create document");
    }

    // Initialize the Docs API client
    const docs = google.docs({ version: "v1", auth });

    // Insert text into the document
    await docs.documents.batchUpdate({
      documentId: fileId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: content,
            },
          },
        ],
      },
    });
    // After creating the file
    const permissions = [
      {
        type: "user",
        role: "writer",
        emailAddress: "coursemagicai@gmail.com", // replace with your email
      },
    ];

    await drive.permissions.create({
      fileId: fileId,
      requestBody: permissions[0],
    });

    // Step 2: Update the revision to publish the document
    const publishBody = {
      resource: {
        published: true,
        publishedOutsideDomain: true,
        publishAuto: true,
      },
      fileId: fileId,
      revisionId: "head", // Using 'head' automatically takes the latest revision
    };

    await drive.revisions.update(publishBody);

    const embedLink = `https://docs.google.com/document/d/${fileId}/pub`;

    return {
      statusCode: 200,
      body: JSON.stringify({ embedLink, fileId }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create and publish document" }),
    };
  }
};
