import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || "{}");
    const { email, password } = requestBody;

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

    // Retrieve the user from the database
    const params = {
      TableName: "CourseMagic_Users",
      KeyConditionExpression: "Email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    };

    const result = await dynamoDb.query(params).promise();

    if (result.Items === undefined) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: "Invalid email or password" }),
      };
    }

    if (result.Items.length === 0) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: "Invalid email or password" }),
      };
    }
    
    const user = result.Items[0];
    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);

    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: "Invalid email or password" }),
      };
    }
  
     // Generate JWT
     const secretKey = process.env.JWT_SECRET_KEY;
     const token = jwt.sign({ userId: user.UserID }, secretKey, {
       expiresIn: "24h",
     });
 
     // Return user information along with the token
     return {
       statusCode: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Access-Control-Allow-Credentials': true,
       },
       body: JSON.stringify({
         message: "Login successful",
         token,
         user: {
           firstName: user.FirstName,
           lastName: user.LastName,
           email: user.Email,
         },
       }),
     };
   } catch (error) {  // <-- Add this catch block
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