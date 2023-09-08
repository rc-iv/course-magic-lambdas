import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
const lambda = new AWS.Lambda();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || "{}");
    const {
      DocumentName,
      DocumentCategory,
      DocumentType,
      GradeLevel,
      AptitudeLevel,
      TopicAdditionalInfo,
      AI_Prompt,
      CourseId,
      UserEmail,
    } = requestBody;

    // Validate request body
    if (!DocumentName || !CourseId || !UserEmail) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          message: "DocumentName, CourseId, and UserEmail are required",
        }),
      };
    }

    // Prepare the payload for the createAndUpdateDocument Lambda
    const payload = {
      fileName: DocumentName,
      content: "The response from the generated AI prompt will go here", // TODO use another lambda to generate the AI prompt and get response
    };

    // Invoke the createAndUpdateDocument Lambda
    const params = {
      FunctionName: "createAndUpdateDocument",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(payload),
    };

    const result = await lambda.invoke(params).promise();
    const responseBody = JSON.parse(result.Payload as string);

    // Extract the embedLink and fileId
    const { embedLink, fileId } = responseBody;

    // Generate a UUID for the document
    const DocumentId = uuidv4();

    // Create a new document
    const newDocument = {
      TableName: "CourseMagic_Documents",
      Item: {
        DocumentId,
        DocumentName,
        DocumentCategory,
        DocumentType,
        GradeLevel,
        AptitudeLevel,
        TopicAdditionalInfo,
        AI_Prompt: "", // Empty for now, to be populated later
        CreatedAt: new Date().toISOString(),
        LastModified: new Date().toISOString(),
        CourseId,
        UserEmail,
        DocumentURL: embedLink,
        FileId: fileId,
      },
    };

    await dynamoDb.put(newDocument).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: "Document successfully created",
        DocumentId,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
