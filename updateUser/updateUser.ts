import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || "{}");
    const { email, firstName, lastName } = requestBody;

    // Validate request body
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email is required" }),
      };
    }

    // Update user information
    const params = {
      TableName: "CourseMagic_Users",
      Key: { "Email": email },
      UpdateExpression: "set FirstName = :f, LastName = :l",
      ExpressionAttributeValues: {
        ":f": firstName,
        ":l": lastName
      },
      ReturnValues: "UPDATED_NEW"
    };

    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User updated successfully", updatedAttributes: result.Attributes }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
