import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || "{}");
    const { DocumentId, DocumentName, DocumentCategory, DocumentType, GradeLevel, AptitudeLevel, TopicAdditionalInfo, AI_Prompt, DocumentURL } = requestBody;

    // Validate request body
    if (!DocumentId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: "DocumentId is required for updating" }),
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

    // Update the document
    const updateParams = {
      TableName: "CourseMagic_Documents",
      Key: {
        "DocumentId": DocumentId
      },
      UpdateExpression: "set DocumentName = :n, DocumentCategory = :c, DocumentType = :t, GradeLevel = :g, AptitudeLevel = :a, TopicAdditionalInfo = :info, AI_Prompt = :p, DocumentURL = :u, LastModified = :m",
      ExpressionAttributeValues: {
        ":n": DocumentName,
        ":c": DocumentCategory,
        ":t": DocumentType,
        ":g": GradeLevel,
        ":a": AptitudeLevel,
        ":info": TopicAdditionalInfo,
        ":p": AI_Prompt,
        ":u": DocumentURL,
        ":m": new Date().toISOString()
      },
      ReturnValues: "UPDATED_NEW"
    };

    await dynamoDb.update(updateParams).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: "Document updated successfully" }),
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
