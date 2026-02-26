"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@storagehub/api-augment");
const core_1 = require("@storagehub-sdk/core");
const clientService_js_1 = require("./services/clientService.js");
const fileOperations_js_1 = require("./operations/fileOperations.js");
const mspService_js_1 = require("./services/mspService.js");
const bucketOperations_js_1 = require("./operations/bucketOperations.js");
async function run() {
    // Initialize WASM
    await (0, core_1.initWasm)();
    console.log('🚀 Starting DataHaven Storage End-to-End Script...');
    // 1. Check MSP Health
    const mspHealth = await mspService_js_1.mspClient.info.getHealth();
    console.log('MSP Health Status:', mspHealth);
    // 2. Create Bucket
    const bucketName = 'init-bucket-' + Date.now();
    const { bucketId, txReceipt } = await (0, bucketOperations_js_1.createBucket)(bucketName);
    console.log(`Created Bucket ID: ${bucketId}`);
    // 3. Verify bucket exists on chain
    const bucketData = await (0, bucketOperations_js_1.verifyBucketCreation)(bucketId);
    console.log('Bucket data:', bucketData);
    // 4. Wait until indexer/backend knows about the bucket
    await (0, bucketOperations_js_1.waitForBackendBucketReady)(bucketId);
    // 5. Upload file
    const fileName = 'helloworld.txt';
    const filePath = new URL(`./files/${fileName}`, import.meta.url).pathname;
    const { fileKey, uploadReceipt } = await (0, fileOperations_js_1.uploadFile)(bucketId, filePath, fileName);
    console.log(`File uploaded: ${fileKey}`);
    console.log(`Status: ${uploadReceipt.status}`);
    // 6. Wait until indexer/backend knows about the file
    await (0, fileOperations_js_1.waitForMSPConfirmOnChain)(fileKey.toHex());
    await (0, fileOperations_js_1.waitForBackendFileReady)(bucketId, fileKey.toHex());
    // 7. Download file
    const downloadedFilePath = new URL('./files/helloworld_downloaded.txt', import.meta.url).pathname;
    const downloadedFile = await (0, fileOperations_js_1.downloadFile)(fileKey, downloadedFilePath);
    console.log(`File type: ${downloadedFile.mime}`);
    console.log(`Downloaded ${downloadedFile.size} bytes to ${downloadedFile.path}`);
    // 8. Verify download integrity
    const isValid = await (0, fileOperations_js_1.verifyDownload)(filePath, downloadedFilePath);
    console.log(`File integrity verified: ${isValid ? 'PASSED' : 'FAILED'}`);
    console.log('🚀 DataHaven Storage End-to-End Script Completed Successfully.');
    await clientService_js_1.polkadotApi.disconnect();
}
run();
