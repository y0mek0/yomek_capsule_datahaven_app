import { storageHubClient, publicClient, polkadotApi, address } from '../services/clientService.js';
import { mspClient, getMspInfo, getValueProps } from '../services/mspService.js';
export async function createBucket(bucketName) {
    // Get basic MSP information from the MSP including its ID
    const { mspId } = await getMspInfo();
    // Choose one of the value props retrieved from the MSP through the helper function
    const valuePropId = await getValueProps();
    console.log(`Value Prop ID: ${valuePropId}`);
    // Derive bucket ID
    const bucketId = (await storageHubClient.deriveBucketId(address, bucketName));
    console.log(`Derived bucket ID: ${bucketId}`);
    // Check that the bucket doesn't exist yet
    const bucketBeforeCreation = await polkadotApi.query.providers.buckets(bucketId);
    console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);
    if (!bucketBeforeCreation.isEmpty) {
        throw new Error(`Bucket already exists: ${bucketId}`);
    }
    const isPrivate = false;
    // Create bucket on chain
    const txHash = await storageHubClient.createBucket(mspId, bucketName, isPrivate, valuePropId);
    console.log('createBucket() txHash:', txHash);
    if (!txHash) {
        throw new Error('createBucket() did not return a transaction hash');
    }
    // Wait for transaction receipt
    const txReceipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
    });
    if (txReceipt.status !== 'success') {
        throw new Error(`Bucket creation failed: ${txHash}`);
    }
    return { bucketId, txReceipt };
}
// Verify bucket creation on chain and return bucket data
export async function verifyBucketCreation(bucketId) {
    const { mspId } = await getMspInfo();
    const bucket = await polkadotApi.query.providers.buckets(bucketId);
    if (bucket.isEmpty) {
        throw new Error('Bucket not found on chain after creation');
    }
    const bucketData = bucket.unwrap().toHuman();
    console.log('Bucket userId matches initial bucket owner address', bucketData.userId === address);
    console.log(`Bucket MSPId matches initial MSPId: ${bucketData.mspId === mspId}`);
    return bucketData;
}
export async function waitForBackendBucketReady(bucketId) {
    const maxAttempts = 10; // Number of polling attempts
    const delayMs = 2000; // Delay between attempts in milliseconds
    for (let i = 0; i < maxAttempts; i++) {
        console.log(`Checking for bucket in MSP backend, attempt ${i + 1} of ${maxAttempts}...`);
        try {
            // Query the MSP backend for the bucket metadata.
            // If the backend has synced the bucket, this call resolves successfully.
            const bucket = await mspClient.buckets.getBucket(bucketId);
            if (bucket) {
                // Bucket is now available and the script can safely continue
                console.log('Bucket found in MSP backend:', bucket);
                return;
            }
        }
        catch (error) {
            // Backend hasn’t indexed the bucket yet
            if (error.status === 404 || error.body.error === 'Not found: Record') {
                console.log(`Bucket not found in MSP backend yet (404).`);
            }
            else {
                // Any other error is unexpected and should fail the entire workflow
                console.log('Unexpected error while fetching bucket from MSP:', error);
                throw error;
            }
        }
        // Wait before polling again
        await new Promise((r) => setTimeout(r, delayMs));
    }
    // All attempts exhausted
    throw new Error(`Bucket ${bucketId} not found in MSP backend after waiting`);
}
