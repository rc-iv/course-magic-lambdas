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
globalThis.AbortController = require("abort-controller");
const AWS = __importStar(require("aws-sdk"));
const uuid_1 = require("uuid");
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
const lambda = new AWS.Lambda();
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestBody = JSON.parse(event.body || "{}");
        const { DocumentName, DocumentCategory, DocumentType, GradeLevel, AptitudeLevel, TopicAdditionalInfo, AI_Prompt, CourseId, UserEmail, CourseName, } = requestBody;
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
        const functions = [
            {
                name: "create_document",
                description: "Creates a document bsed on the response data",
                parameters: {
                    type: "object",
                    properties: {
                        payload: {
                            type: "string",
                            description: "The JSON data that is used to create the document content via google api",
                        },
                    },
                    required: ["payload"],
                },
            },
        ];
        let userPrompt = "";
        let googleDocType = "";
        // Generate a prompt for OpenAI API based on the document type
        if (DocumentType === "Lesson Plans") {
            console.log("Generating prompt for Lesson Plan");
            userPrompt = `Create a "Lesson Plan" document for the subject of ${CourseName} for students of grade level: ${GradeLevel} with a ${AptitudeLevel} aptitude level. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. The Lesson Plan should be detailed and include the following sections when applicable: 1. Objectives 2. Standards 3. Materials 4. Introduction 5. Guided Practice 6. Independent Practice 7. Assessment 8. Closure 9. Homework 10. Extension Activities 11. Accommodations 12. Modifications 13. Possible Next Steps 14. Reflection. Return data in such a way it can be uploaded via googel api to create a google document.`;
            googleDocType = "document";
        }
        else if (DocumentType === "Course Outline/Syllabus") {
            console.log("Generating prompt for Course Outline/Syllabus");
            userPrompt = `Create a "Syllabus" document for the subject of ${CourseName} for students of grade level:${GradeLevel} and aptitude level: ${AptitudeLevel}. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via googel api to create a google document`;
            googleDocType = "document";
        }
        else if (DocumentType === "Gradebook Template") {
            console.log("Generating prompt for Gradebook Template");
            userPrompt = `Create a "Gradebook Template" document for the subject of ${CourseName} for students of grade level:${GradeLevel}. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google sheet.`;
            googleDocType = "sheet";
        }
        else if (DocumentType === "Class Roster") {
            console.log("Generating prompt for Class Roster");
            userPrompt = `Create a "Class Roster" document for the subject of ${CourseName} for students of grade level:${GradeLevel}. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google sheet.`;
            googleDocType = "sheet";
        }
        else if (DocumentType === "Attendance Sheet") {
            console.log("Generating prompt for Attendance Sheet");
            userPrompt = `Create a "Attendance Sheet" document for the subject of ${CourseName} for students of grade level:${GradeLevel}. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google sheet.`;
            googleDocType = "sheet";
        }
        else if (DocumentType === "Seating Chart") {
            console.log("Generating prompt for Seating Chart");
            userPrompt = `Create a "Seating Chart" document for the subject of ${CourseName} for students of grade level:${GradeLevel}. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google sheet.`;
            googleDocType = "sheet";
        }
        else if (DocumentType === "Lecture Slides") {
            console.log("Generating prompt for Lecture Slides");
            userPrompt = `Create lecture slides for the subject of ${CourseName} for students of grade level:${GradeLevel}. Slides should be completely filled out with all required information for the entire lecture. Include example problems and solutions is applicable. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google slide.`;
            googleDocType = "slide";
        }
        else if (DocumentType === "Handouts") {
            console.log("Generating prompt for Handouts");
            userPrompt = `Create a handout for the subject of ${CourseName} for students of grade level:${GradeLevel}. Include example problems and detailed step by step solutions if applicable. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        else if (DocumentType === "Homework Assignments") {
            console.log("Generating prompt for Homework Assignments");
            userPrompt = `Create a homework assignment for the subject of ${CourseName} for students of grade level:${GradeLevel}.Include problems and detailed solutions if applicable. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        else if (DocumentType === "Quizzes") {
            console.log("Generating prompt for Quizzes");
            userPrompt = `Create a quizz for the subject of ${CourseName} for students of grade level:${GradeLevel} and aptitude level ${AptitudeLevel}. Include questions and solutions. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        else if (DocumentType === "Exams") {
            console.log("Generating prompt for Exams");
            userPrompt = `Create and exam for the subject of ${CourseName} for students of grade level:${GradeLevel} and aptitude level ${AptitudeLevel}. Include questions and solutions. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        else if (DocumentType === "Project Guidelines") {
            console.log("Generating prompt for Project Guidelines");
            userPrompt = `Create project guidelines for the subject of ${CourseName} for students of grade level:${GradeLevel} and aptitude level ${AptitudeLevel}. Include detailed instructions and grading rubric. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        else if (DocumentType === "Study Guides") {
            console.log("Generating prompt for Study Guides");
            const userPrompt = `Create a study guide for the subject of ${CourseName} for students of grade level:${GradeLevel} and aptitude level ${AptitudeLevel}. Include detailed instructions and grading rubric. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        else if (DocumentType === "Rubric") {
            console.log("Generating prompt for Rubric");
            userPrompt = `Create a rubric for the subject of ${CourseName} for students of grade level:${GradeLevel} and aptitude level ${AptitudeLevel}. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        else if (DocumentType === "Extra Credit Opportunity") {
            console.log("Generating prompt for Extra Credit Opportunity");
            userPrompt = `Create an extra credit opportunity for the subject of ${CourseName} for students of grade level:${GradeLevel} and aptitude level ${AptitudeLevel}. Include detailed instructions and grading rubric. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        else {
            console.log("Generating prompt for Other");
            userPrompt = `Create a ${DocumentType} document for the subject of ${CourseName} for students of grade level:${GradeLevel} and aptitude level ${AptitudeLevel}. Take into consideration the following additional info/topic:${TopicAdditionalInfo}. Return data in such a way it can be uploaded via google api to create a google document.`;
            googleDocType = "document";
        }
        const systemPrompt = `You are an expert teacher on ${CourseName}. Your task is to create professional and well formatted documents at the request of the user. Only return the docmument without any conversation. The document should be returned in a format that can be used to create a document (sheet/slide/document) with google api.`;
        // Call OpenAI API to get the generated content
        const completion = yield openai.chat.completions.create({
            functions: functions,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: "gpt-4",
        });
        console.log(`OpenAI Completion: ${JSON.stringify(completion)}`);
        const aiGeneratedContent = completion.choices[0].message.content;
        console.log(`AI Generated Content: ${JSON.stringify(aiGeneratedContent)}`);
        // Prepare the payload for the createAndUpdateDocument Lambda
        const payload = {
            fileName: DocumentName,
            content: aiGeneratedContent,
            googleDocType: googleDocType,
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
                CourseName,
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
