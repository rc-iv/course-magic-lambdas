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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const AWS = __importStar(require("aws-sdk"));
const uuid_1 = require("uuid");
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
const lambda = new AWS.Lambda();
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestBody = JSON.parse(event.body || "{}");
        const { DocumentName, DocumentCategory, DocumentType, GradeLevel, AptitudeLevel, TopicAdditionalInfo, AI_Prompt, CourseId, UserEmail, } = requestBody;
        // Validate request body
        if (!DocumentName || !CourseId || !UserEmail) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({
                    message: "DocumentName, CourseId, and UserEmail are required",
                }),
            };
        }
        // Prepare the payload for the createAndUpdateDocument Lambda
        const payload = {
            fileName: DocumentName,
            content: "The response from the generated AI prompt will go here", // TODO use another lambda to generate the AI prompt and get response
        };
        // Invoke the createAndUpdateDocument Lambda
        const params = {
            FunctionName: "createAndUpdateDocument",
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(payload),
        };
        const result = yield lambda.invoke(params).promise();
        const responseBody = JSON.parse(result.Payload);
        // Extract the embedLink and fileId
        const { embedLink, fileId } = responseBody;
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
            },
        };
        yield dynamoDb.put(newDocument).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
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
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
});
exports.handler = handler;
