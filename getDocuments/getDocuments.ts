import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const { courseId } = event.queryStringParameters || {};

        if (!courseId) {
            return {
                statusCode: 400,
                headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ message: "courseId is required in query parameters" }),
            };
        }

        const params = {
            TableName: "CourseMagic_Documents",
            IndexName: "CourseIdIndex",
            KeyConditionExpression: "CourseId = :courseId",
            ExpressionAttributeValues: {
                ":courseId": courseId,
            },
        };

        const result = await dynamoDb.query(params).promise();

        return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(result.Items),
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
