import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log(`Event: ${JSON.stringify(event)}`)
    const courseID = event.pathParameters?.CourseID;
    console.log(`CourseID: ${courseID}`)
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

    // Delete the course
    const deleteParams = {
      TableName: "CourseMagic_Courses",
      Key: {
        "CourseID": courseID
      }
    };

    await dynamoDb.delete(deleteParams).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: "Course deleted successfully" }),
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
