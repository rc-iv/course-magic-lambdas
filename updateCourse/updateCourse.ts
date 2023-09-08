import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || "{}");
    
    console.log(`Request body: ${JSON.stringify(requestBody)}`)
    const courseID = requestBody.CourseID;

    // Check if the course exists
    const getParams = {
      TableName: "CourseMagic_Courses",
      Key: {
        "CourseID": courseID
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
        body: JSON.stringify({ message: "Course not found" }),
      };
    }

    // Update the course
    const updateParams = {
      TableName: "CourseMagic_Courses",
      Key: {
        "CourseID": courseID
      },
      UpdateExpression: "set CourseName = :n, GradeLevel = :g, AptitudeLevel = :a, AdditionalInfo = :i",
      ExpressionAttributeValues: {
        ":n": requestBody.CourseName,
        ":g": requestBody.GradeLevel,
        ":a": requestBody.AptitudeLevel,
        ":i": requestBody.AdditionalInfo
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
      body: JSON.stringify({ message: "Course updated successfully" }),
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
