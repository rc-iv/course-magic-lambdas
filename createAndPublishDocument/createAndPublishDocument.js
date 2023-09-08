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
    // Initialize the Drive API client
    const auth = new googleapis_1.google.auth.JWT(process.env.SERVICE_ACCOUNT_EMAIL, undefined, (_a = process.env.SERVICE_ACCOUNT_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"), ["https://www.googleapis.com/auth/drive"]);
    // Initialize the Drive API client
    const drive = googleapis_1.google.drive({ version: "v3", auth });
    // Extract file name and content from the event body
    const body = JSON.parse(event.body || "{}");
    const fileName = body.fileName || "New Document";
    const content = body.content || "Default text content";
    try {
        // Step 1: Create a new Google Document with the given name
        console.log("Creating document");
        const createResponse = yield drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: "application/vnd.google-apps.document",
            },
            fields: "id",
        });
        console.log(`Created document with response: ${JSON.stringify(createResponse)}`);
        const fileId = createResponse.data.id;
        console.log(`File ID: ${fileId}`);
        if (!fileId) {
            throw new Error("Failed to create document");
        }
        // Initialize the Docs API client
        const docs = googleapis_1.google.docs({ version: "v1", auth });
        // Insert text into the document
        yield docs.documents.batchUpdate({
            documentId: fileId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: {
                                index: 1,
                            },
                            text: content,
                        },
                    },
                ],
            },
        });
        // After creating the file
        const permissions = [
            {
                type: "user",
                role: "writer",
                emailAddress: "coursemagicai@gmail.com", // replace with your email
            },
        ];
        yield drive.permissions.create({
            fileId: fileId,
            requestBody: permissions[0],
        });
        // Step 2: Update the revision to publish the document
        const publishBody = {
            resource: {
                published: true,
                publishedOutsideDomain: true,
                publishAuto: true,
            },
            fileId: fileId,
            revisionId: "head", // Using 'head' automatically takes the latest revision
        };
        yield drive.revisions.update(publishBody);
        const embedLink = `https://docs.google.com/document/d/${fileId}/pub`;
        return {
            statusCode: 200,
            body: JSON.stringify({ embedLink, fileId }),
        };
    }
    catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to create and publish document" }),
        };
    }
});
exports.handler = handler;
