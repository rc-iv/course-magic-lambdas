import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as bcrypt from "bcryptjs";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || "{}");
    console.log(`Request body: ${JSON.stringify(requestBody)}`)
    const { email, password, firstName, lastName } = requestBody;

    // Validate request body
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: "Email and password are required" }),
      };
    }


    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user
    const newUser = {
      TableName: "CourseMagic_Users",
      Item: {
        Email: email,
        PasswordHash: hashedPassword,
        FirstName: firstName,
        LastName: lastName,
        CreatedAt: new Date().toISOString(),
        LastLogin: new Date().toISOString(),
      },
    };

    await dynamoDb.put(newUser).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: "User registered successfully", email }),
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
