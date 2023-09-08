"use strict";
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
const googleapis_1 = require("googleapis");
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Initialize the Google Drive API client
    const auth = new googleapis_1.google.auth.JWT(process.env.SERVICE_ACCOUNT_EMAIL, undefined, (_a = process.env.SERVICE_ACCOUNT_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'), ["https://www.googleapis.com/auth/drive"]);
    // Initialize the Google Drive API client
    const drive = googleapis_1.google.drive({ version: "v3", auth });
    // Extract the file ID from the event body
    const body = JSON.parse(event.body || "{}");
    const fileId = body.fileId;
    if (!fileId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "File ID is required" }),
        };
    }
    try {
        // Delete the Google Document
        yield drive.files.delete({ fileId });
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Document deleted successfully" }),
        };
    }
    catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to delete document" }),
        };
    }
});
exports.handler = handler;
