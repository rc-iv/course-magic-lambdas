import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";  // Make sure to install the 'uuid' package

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || "{}");
    console.log(`Request body: ${requestBody}`);
    const { UserEmail, CourseName, GradeLevel, AptitudeLevel, AdditionalInfo, CourseSubject } = requestBody;
    // Validate request body
    if (!UserEmail || !CourseName || !GradeLevel || !AptitudeLevel || !CourseSubject) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: "UserEmail, CourseName, GradeLevel, CourseSubject, and AptitudeLevel are required" }),
      };
    }

    // Generate a UUID for the course
    const courseId = uuidv4();

    // Create a new course
    const newCourse = {
      TableName: "CourseMagic_Courses",
      Item: {
        CourseID: courseId,
        UserEmail: UserEmail,
        CourseName: CourseName,
        GradeLevel: GradeLevel,
        AptitudeLevel: AptitudeLevel,
        AdditionalInfo: AdditionalInfo || null,
        Documents: [],
        CreatedAt: new Date().toISOString(),
        LastModified: new Date().toISOString(),
        CourseSubject: CourseSubject,
      },
    };

    await dynamoDb.put(newCourse).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: "Course created successfully", courseId }),
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
