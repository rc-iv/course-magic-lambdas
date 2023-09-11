"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
globalThis.AbortController = require('abort-controller');
const AWS = __importStar(require("aws-sdk"));
const uuid_1 = require("uuid");
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
const lambda = new AWS.Lambda();
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestBody = JSON.parse(event.body || "{}");
        const { DocumentName, DocumentCategory, DocumentType, GradeLevel, AptitudeLevel, TopicAdditionalInfo, AI_Prompt, CourseId, UserEmail, CourseName } = requestBody;
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
        const userPrompt = `Create a ${DocumentType} document for the subject of ${CourseName} for students of grade levev: ${GradeLevel} with a ${AptitudeLevel} aptitude level. Take into account the following topic and additional information: ${TopicAdditionalInfo}`;
        const systemPrompt = `You are an expert teacher on ${CourseName}. Your task is to create professional and well formatted documents at the request of the user. Only return the docmument without any conversation.`;
        // Call OpenAI API to get the generated content
        const completion = yield openai.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            model: "gpt-4",
        });
        console.log(`OpenAI Completion: ${JSON.stringify(completion)}`);
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
        const result = yield lambda.invoke(params).promise();
        console.log(`Result from createAndUpdateDocument: ${JSON.stringify(result)}`);
        const responseBody = JSON.parse(result.Payload);
        // Parse the body to get the actual data
        const parsedBody = JSON.parse(responseBody.body);
        // Extract the embedLink and fileId
        const { embedLink, fileId } = parsedBody;
        console.log(`embedLink: ${embedLink}`);
        console.log(`fileId: ${fileId}`);
        // Generate a UUID for the document
        const DocumentId = (0, uuid_1.v4)();
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
                AI_Prompt: "",
                CreatedAt: new Date().toISOString(),
                LastModified: new Date().toISOString(),
                CourseId,
                UserEmail,
                DocumentURL: embedLink,
                FileId: fileId,
                CourseName
            },
        };
        yield dynamoDb.put(newDocument).promise();
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
    }
    catch (error) {
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
});
exports.handler = handler;
