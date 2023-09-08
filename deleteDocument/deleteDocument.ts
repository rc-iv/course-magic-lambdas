import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const DocumentId = event.pathParameters?.DocumentId;
    
    // Validate request body
    if (!DocumentId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: "DocumentId is required for deletion" }),
      };
    }

    // Check if the document exists
    const getParams = {
      TableName: "CourseMagic_Documents",
      Key: {
        "DocumentId": DocumentId
      }
    };

    const getResult = await dynamoDb.get(getParams).promise();

    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: "Document not found" }),
      };
    }

    // Delete the document
    const deleteParams = {
      TableName: "CourseMagic_Documents",
      Key: {
        "DocumentId": DocumentId
      }
    };

    await dynamoDb.delete(deleteParams).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: "Document deleted successfully" }),
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
