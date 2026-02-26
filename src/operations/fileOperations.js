import { createReadStream, statSync, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
import { TypeRegistry } from '@polkadot/types';
import { storageHubClient, address, publicClient, polkadotApi, account, } from '../services/clientService.js';
import { mspClient, getMspInfo, authenticateUser, } from '../services/mspService.js';
export async function uploadFile(bucketId, filePath, fileName) {
    //   ISSUE STORAGE REQUEST
    // Set up FileManager
    const fileSize = statSync(filePath).size;
    const fileManager = new FileManager({
        size: fileSize,
        stream: () => Readable.toWeb(createReadStream(filePath)),
    });
    // Get file details
    const fingerprint = await fileManager.getFingerprint();
    console.log(`Fingerprint: ${fingerprint.toHex()}`);
    const fileSizeBigInt = BigInt(fileManager.getFileSize());
    console.log(`File size: ${fileSize} bytes`);
    // Get MSP details
    // Fetch MSP details from the backend (includes its on-chain ID and libp2p addresses)
    const { mspId, multiaddresses } = await getMspInfo();
    // Ensure the MSP exposes at least one multiaddress (required to reach it over libp2p)
    if (!multiaddresses?.length) {
        throw new Error('MSP multiaddresses are missing');
    }
    // Extract the MSP’s libp2p peer IDs from the multiaddresses
    // Each address should contain a `/p2p/<peerId>` segment
    const peerIds = extractPeerIDs(multiaddresses);
    // Validate that at least one valid peer ID was found
    if (peerIds.length === 0) {
        throw new Error('MSP multiaddresses had no /p2p/<peerId> segment');
    }
    // Extracts libp2p peer IDs from a list of multiaddresses.
    // A multiaddress commonly ends with `/p2p/<peerId>`, so this function
    // splits on that delimiter and returns the trailing segment when present.
    function extractPeerIDs(multiaddresses) {
        return (multiaddresses ?? [])
            .map((addr) => addr.split('/p2p/').pop())
            .filter((id) => !!id);
    }
    // Set the redundancy policy for this request.
    // Custom replication allows the client to specify an exact replica count.
    const replicationLevel = ReplicationLevel.Custom;
    const replicas = 1;
    // Issue storage request
    const txHash = await storageHubClient.issueStorageRequest(bucketId, fileName, fingerprint.toHex(), fileSizeBigInt, mspId, peerIds, replicationLevel, replicas);
    console.log('issueStorageRequest() txHash:', txHash);
    if (!txHash) {
        throw new Error('issueStorageRequest() did not return a transaction hash');
    }
    // Wait for storage request transaction
    const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
    });
    if (receipt.status !== 'success') {
        throw new Error(`Storage request failed: ${txHash}`);
    }
    console.log('issueStorageRequest() txReceipt:', receipt);
    //   VERIFY STORAGE REQUEST ON CHAIN
    // Compute file key
    const registry = new TypeRegistry();
    const owner = registry.createType('AccountId20', account.address);
    const bucketIdH256 = registry.createType('H256', bucketId);
    const fileKey = await fileManager.computeFileKey(owner, bucketIdH256, fileName);
    // Verify storage request on chain
    const storageRequest = await polkadotApi.query.fileSystem.storageRequests(fileKey);
    if (!storageRequest.isSome) {
        throw new Error('Storage request not found on chain');
    }
    // Read the storage request data
    const storageRequestData = storageRequest.unwrap().toHuman();
    console.log('Storage request data:', storageRequestData);
    console.log('Storage request bucketId matches initial bucketId:', storageRequestData.bucketId === bucketId);
    console.log('Storage request fingerprint matches initial fingerprint', storageRequestData.fingerprint === fingerprint.toString());
    //   UPLOAD FILE TO MSP
    // Authenticate bucket owner address with MSP prior to uploading file
    const authProfile = await authenticateUser();
    console.log('Authenticated user profile:', authProfile);
    // Upload file to MSP
    const uploadReceipt = await mspClient.files.uploadFile(bucketId, fileKey.toHex(), await fileManager.getFileBlob(), address, fileName);
    console.log('File upload receipt:', uploadReceipt);
    if (uploadReceipt.status !== 'upload_successful') {
        throw new Error('File upload to MSP failed');
    }
    return { fileKey, uploadReceipt };
}
export async function waitForMSPConfirmOnChain(fileKey) {
    const maxAttempts = 10; // Number of polling attempts
    const delayMs = 2000; // Delay between attempts in milliseconds
    for (let i = 0; i < maxAttempts; i++) {
        console.log(`Check storage request has been confirmed by the MSP on-chain, attempt ${i + 1} of ${maxAttempts}...`);
        // Query the runtime for the StorageRequest entry associated with this fileKey
        const req = await polkadotApi.query.fileSystem.storageRequests(fileKey);
        // StorageRequest removed from state before confirmation is an error
        if (req.isNone) {
            throw new Error(`StorageRequest for ${fileKey} no longer exists on-chain.`);
        }
        // Decode the on-chain metadata struct
        const data = req.unwrap().toHuman();
        // Extract the MSP confirmation tuple (mspId, bool)
        const mspTuple = data.msp;
        // The second value in the tuple is a SCALE Bool (codec), so convert using .isTrue
        const mspConfirmed = mspTuple ? mspTuple[1] : false;
        // If MSP has confirmed the storage request, we’re good to proceed
        if (mspConfirmed) {
            console.log('Storage request confirmed by MSP on-chain');
            return;
        }
        // Wait before polling again
        await new Promise((r) => setTimeout(r, delayMs));
    }
    // All attempts exhausted
    throw new Error(`FileKey ${fileKey} not ready for download after waiting ${maxAttempts * delayMs} ms`);
}
export async function waitForBackendFileReady(bucketId, fileKey) {
    // wait up to 12 minutes (144 attempts x 5 seconds)
    // 11 minutes is the amount of time BSPs have to reach the required replication level
    const maxAttempts = 144; // Number of polling attempts
    const delayMs = 5000; // Delay between attempts in milliseconds
    for (let i = 0; i < maxAttempts; i++) {
        console.log(`Checking for file in MSP backend, attempt ${i + 1} of ${maxAttempts}...`);
        try {
            // Query MSP backend for the file metadata
            const fileInfo = await mspClient.files.getFileInfo(bucketId, fileKey);
            // File is fully ready — backend has indexed it and can serve it
            if (fileInfo.status === 'ready') {
                console.log('File found in MSP backend:', fileInfo);
                return fileInfo;
            }
            // Failure statuses (irrecoverable for this upload lifecycle)
            if (fileInfo.status === 'revoked') {
                throw new Error('File upload was cancelled by user');
            }
            else if (fileInfo.status === 'rejected') {
                throw new Error('File upload was rejected by MSP');
            }
            else if (fileInfo.status === 'expired') {
                throw new Error('Storage request expired: the required number of BSP replicas was not achieved within the deadline');
            }
            // Otherwise still pending (indexer not done, MSP still syncing, etc.)
            console.log(`File status is "${fileInfo.status}", waiting...`);
        }
        catch (error) {
            if (error?.status === 404 || error?.body?.error === 'Not found: Record') {
                // Handle "not yet indexed" as a *non-fatal* condition
                console.log('File not yet indexed in MSP backend (404 Not Found). Waiting before retry...');
            }
            else {
                // Any unexpected backend error should stop the workflow and surface to the caller
                console.log('Unexpected error while fetching file from MSP:', error);
                throw error;
            }
        }
        // Wait before polling again
        await new Promise((r) => setTimeout(r, delayMs));
    }
    // All attempts exhausted
    throw new Error('Timed out waiting for MSP backend to mark file as ready');
}
export async function downloadFile(fileKey, downloadPath) {
    // Download file from MSP
    const downloadResponse = await mspClient.files.downloadFile(fileKey.toHex());
    // Check if the download response was successful
    if (downloadResponse.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResponse.status}`);
    }
    // Save downloaded file
    // Create a writable stream to the target file path
    // This stream will receive binary data chunks and write them to disk.
    const writeStream = createWriteStream(downloadPath);
    // Convert the Web ReadableStream into a Node.js-readable stream
    const readableStream = Readable.fromWeb(downloadResponse.stream);
    // Pipe the readable (input) stream into the writable (output) stream
    // This transfers the file data chunk by chunk and closes the write stream automatically
    // when finished.
    return new Promise((resolve, reject) => {
        readableStream.pipe(writeStream);
        writeStream.on('finish', async () => {
            const { size } = await import('node:fs/promises').then((fs) => fs.stat(downloadPath));
            const mime = downloadResponse.contentType === null
                ? undefined
                : downloadResponse.contentType;
            resolve({
                path: downloadPath,
                size,
                mime, // if available
            });
        });
        writeStream.on('error', reject);
    });
}
// Compares an original file with a downloaded file byte-for-byte
export async function verifyDownload(originalPath, downloadedPath) {
    const originalBuffer = await import('node:fs/promises').then((fs) => fs.readFile(originalPath));
    const downloadedBuffer = await import('node:fs/promises').then((fs) => fs.readFile(downloadedPath));
    return originalBuffer.equals(downloadedBuffer);
}
