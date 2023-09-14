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
const create_document = (auth, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const docs = googleapis_1.google.docs({ version: "v1", auth });
    const res = yield docs.documents.create({
        requestBody: {
            title: fileName,
        },
    });
    console.log(res.data);
    return res.data;
});
const fill_content_document = (auth, // Replace 'any' with the specific type of auth object
documentId, contentJson) => __awaiter(void 0, void 0, void 0, function* () {
    const docs = googleapis_1.google.docs({ version: "v1", auth });
    let requests = [];
    let index = 1;
    // Process title
    if (contentJson.title) {
        requests.push({
            insertText: {
                location: { index },
                text: `${contentJson.title}\n`,
            },
        });
        index += contentJson.title.length + 1; // +1 for the newline character
    }
    // Process body
    contentJson.body.forEach((item) => {
        if (item.sectionBreak) {
            // For now, we just add a line break for a section break
            requests.push({
                insertText: {
                    location: { index },
                    text: '\n',
                },
            });
            index++;
        }
        else if (item.paragraph) {
            let paragraphText = '';
            item.paragraph.elements.forEach((element) => {
                paragraphText += element.textRun.content;
            });
            requests.push({
                insertText: {
                    location: { index },
                    text: paragraphText,
                },
            });
            index += paragraphText.length;
            // Apply formatting
            let startOffset = index - paragraphText.length;
            item.paragraph.elements.forEach((element) => {
                let textStyle = element.textRun.textStyle;
                if (textStyle) {
                    let endIndex = startOffset + element.textRun.content.length;
                    if (textStyle.bold) {
                        requests.push({
                            updateTextStyle: {
                                range: {
                                    startIndex: startOffset,
                                    endIndex: endIndex,
                                },
                                textStyle: { bold: true },
                                fields: 'bold',
                            },
                        });
                    }
                    if (textStyle.fontSize) {
                        requests.push({
                            updateTextStyle: {
                                range: {
                                    startIndex: startOffset,
                                    endIndex: endIndex,
                                },
                                textStyle: { fontSize: textStyle.fontSize },
                                fields: 'fontSize',
                            },
                        });
                    }
                }
                startOffset += element.textRun.content.length;
            });
            // Apply alignment
            if (item.paragraph.alignment) {
                requests.push({
                    updateParagraphStyle: {
                        range: {
                            startIndex: index - paragraphText.length,
                            endIndex: index,
                        },
                        paragraphStyle: {
                            alignment: item.paragraph.alignment,
                        },
                        fields: 'alignment',
                    },
                });
            }
        }
    });
    // Make the batchUpdate API call
    const res = yield docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
    });
    console.log(res.data);
    return res.data;
});
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Initialize the Drive API client
    const auth = new googleapis_1.google.auth.JWT(process.env.SERVICE_ACCOUNT_EMAIL, undefined, (_a = process.env.SERVICE_ACCOUNT_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"), ["https://www.googleapis.com/auth/drive"]);
    // Initialize the Drive API client
    const drive = googleapis_1.google.drive({ version: "v3", auth });
    // Extract file name and content from the event
    const { fileName, content } = event;
    console.log(`fileName: ${fileName}`);
    console.log(`content: ${content}`);
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
