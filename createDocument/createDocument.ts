globalThis.AbortController = require('abort-controller');

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          message: "DocumentName, CourseId, and UserEmail are required",
        }),
      };
    }


     // Generate a prompt for OpenAI API based on the document attributes
     const userPrompt = `Create a ${DocumentType} on ${TopicAdditionalInfo} for grade ${GradeLevel} with aptitude level ${AptitudeLevel}.`;
     const systemPrompt = `You are an expert teacher on ${TopicAdditionalInfo} and you will create well formatted content for a google document with the user requested information. You only return the content of the document requests and no other conversation.`
     // Call OpenAI API to get the generated content
     const completion = await openai.chat.completions.create({
         messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
         model: "gpt-4",
       });
 
 
     console.log(`OpenAI Completion: ${JSON.stringify(completion)}`)
     const aiGeneratedContent = completion.choices[0].message.content;
 
     console.log(`AI Generated Content: ${JSON.stringify(aiGeneratedContent)}`);
    // Prepare the payload for the createAndUpdateDocument Lambda
    const payload = {
      fileName: DocumentName,
      content: aiGeneratedContent
    };

    console.log(`Payload: ${JSON.stringify(payload)}`);
    // Invoke the createAndUpdateDocument Lambda
    const params = {
      FunctionName: "CourseMagicCreateAndPublishDocument",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(payload),
    };

    const result = await lambda.invoke(params).promise();
    console.log(
      `Result from createAndUpdateDocument: ${JSON.stringify(result)}`
    );
    const responseBody = JSON.parse(result.Payload as string);

    // Parse the body to get the actual data
    const parsedBody = JSON.parse(responseBody.body);

    // Extract the embedLink and fileId
    const { embedLink, fileId } = parsedBody;

    console.log(`embedLink: ${embedLink}`);
    console.log(`fileId: ${fileId}`);
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
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
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
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
