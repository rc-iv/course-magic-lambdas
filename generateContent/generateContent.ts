import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { Configuration, OpenAIApi } from "openai";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
const lambda = new AWS.Lambda();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
      CourseId,
      UserEmail,
    } = requestBody;

    // Generate a prompt for OpenAI API based on the document attributes
    const prompt = `Create a ${DocumentType} on ${DocumentCategory} for grade ${GradeLevel} with aptitude level ${AptitudeLevel}. Additional Info: ${TopicAdditionalInfo}`;

    // Call OpenAI API to get the generated content
    const openAIResponse = await openai.createCompletion({
      engine: "text-davinci-002",
      prompt,
      max_tokens: 500,
    });

    const aiGeneratedContent = openAIResponse.data.choices[0].text.trim();

    // Prepare the payload for the createAndUpdateDocument Lambda
    const payload = {
      fileName: DocumentName,
      content: aiGeneratedContent,
    };

    // ... (rest of your existing code)

    // Create a new document
    const newDocument = {
      // ... (rest of your existing code)
      AI_Prompt: prompt, // Populate with the generated prompt
      // ... (rest of your existing code)
    };

    // ... (rest of your existing code)

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
