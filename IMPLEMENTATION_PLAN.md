# Implementation Plan: Integrating DataHaven for NFT Storage

This document outlines the detailed plan to integrate DataHaven as a storage layer for the existing NFT minting project. The core NFT minting functionality on the Amoy testnet will remain unchanged.

## Phase 1: Project Setup & Configuration

1.  **Install Dependencies:** Install all necessary packages for the StorageHub SDK to interact with the DataHaven network.
    *   `@storagehub-sdk/core`
    *   `@storagehub-sdk/msp-client`
    *   `@polkadot/api`
    *   `viem`
    *   Other associated packages as per the documentation.

2.  **Create Service Modules:** Create new files for handling network connections as described in the documentation.
    *   `services/clientService.ts`: To configure and initialize clients for interacting with the DataHaven blockchain (EVM & Substrate).
    *   `services/mspService.ts`: To configure and initialize the client for interacting with the Main Storage Provider (MSP).

3.  **Configure for DataHaven Testnet:** Configure both service modules to connect to the DataHaven Testnet using the provided endpoints, Chain ID (55931), and a pre-funded development account for transactions.

## Phase 2: Core DataHaven Functionality

1.  **Create Operation Modules:** Create dedicated modules to handle storage operations, keeping the code organized.
    *   `operations/bucketOperations.ts`: Will contain functions to create and manage buckets on the MSP.
    *   `operations/fileOperations.ts`: Will contain functions for the entire file lifecycle: uploading, downloading, and deleting.

2.  **Implement and Test Bucket Creation:**
    *   Implement the `createBucket` function in `bucketOperations.ts` following the documentation.
    *   Create a test script to execute and verify bucket creation on the DataHaven testnet.

3.  **Implement and Test File Upload/Download:**
    *   Implement the `uploadFile` and `downloadFile` functions in `fileOperations.ts`.
    *   Create test scripts to verify that a sample file can be uploaded, a `fileKey` is returned, and the file can be successfully downloaded using that key.

## Phase 3: Frontend & Smart Contract Integration

1.  **Integrate Upload on Mint:**
    *   Analyze the existing frontend code to identify the function that handles the successful minting of a `Capsule` NFT.
    *   After a successful mint, trigger the `uploadFile` function to store the NFT's associated data (e.g., metadata JSON or an image) on DataHaven.

2.  **Associate NFT with Storage Key (New Contract):**
    *   To avoid modifying the existing, working `Capsule.sol` contract, a new "Registry" smart contract will be created.
    *   This registry contract will store a mapping: `(Capsule Contract Address, Token ID) -> DataHaven File Key`.
    *   After a file is uploaded to DataHaven, a transaction will be sent to this new registry contract to record the association.

3.  **Deploy Registry Contract:**
    *   Write a deployment script for the new `Registry.sol` contract.
    *   Deploy the contract to the Amoy testnet (or the same network as the main NFT contract).

4.  **Integrate Download for Display:**
    *   Analyze the frontend code that displays the user's NFT inventory.
    *   For each NFT, query the `Registry` contract to get the associated DataHaven `fileKey`.
    *   Use the `downloadFile` function to retrieve the data from DataHaven.
    *   Render the retrieved data (e.g., display the image, parse and show metadata) on the page.

## Phase 4: Testing and Verification

1.  **Unit & Integration Tests:** Write automated tests for all new `operations` and `services` modules to ensure they function as expected.

2.  **End-to-End Manual Testing:** Define and execute a manual test plan for the entire user flow:
    *   Connect wallet.
    *   Mint a new Capsule NFT on Amoy.
    *   **Verification:**
        *   Confirm the mint transaction on an Amoy block explorer.
        *   Confirm the transaction to the `Registry` contract was successful.
        *   Confirm the file appears in the MSP (if explorable) or that download works.
    *   Navigate to the inventory page and verify the NFT's specific data is correctly fetched from DataHaven and displayed.

This phased approach ensures that we are building and testing incrementally, without breaking the existing functionality.