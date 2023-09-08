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
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestBody = JSON.parse(event.body || "{}");
        const { DocumentId, DocumentName, DocumentCategory, DocumentType, GradeLevel, AptitudeLevel, TopicAdditionalInfo, AI_Prompt, DocumentURL } = requestBody;
        // Validate request body
        if (!DocumentId) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ message: "DocumentId is required for updating" }),
            };
        }
        // Check if the document exists
        const getParams = {
            TableName: "CourseMagic_Documents",
            Key: {
                "DocumentId": DocumentId
            }
        };
        const getResult = yield dynamoDb.get(getParams).promise();
        if (!getResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ message: "Document not found" }),
            };
        }
        // Update the document
        const updateParams = {
            TableName: "CourseMagic_Documents",
            Key: {
                "DocumentId": DocumentId
            },
            UpdateExpression: "set DocumentName = :n, DocumentCategory = :c, DocumentType = :t, GradeLevel = :g, AptitudeLevel = :a, TopicAdditionalInfo = :info, AI_Prompt = :p, DocumentURL = :u, LastModified = :m",
            ExpressionAttributeValues: {
                ":n": DocumentName,
                ":c": DocumentCategory,
                ":t": DocumentType,
                ":g": GradeLevel,
                ":a": AptitudeLevel,
                ":info": TopicAdditionalInfo,
                ":p": AI_Prompt,
                ":u": DocumentURL,
                ":m": new Date().toISOString()
            },
            ReturnValues: "UPDATED_NEW"
        };
        yield dynamoDb.update(updateParams).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: "Document updated successfully" }),
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
