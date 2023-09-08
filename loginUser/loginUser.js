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
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield dynamoDb.query(params).promise();
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
        const isValidPassword = yield bcrypt.compare(password, user.PasswordHash);
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
    }
    catch (error) { // <-- Add this catch block
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
