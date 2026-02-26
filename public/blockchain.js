
import { ethers } from "ethers";

// --- Configuration ---
const DATAHAVEN_TESTNET_CONFIG = {
    chainId: "0xda7b", // 55931 in hex - CORRECTED!
    chainName: "DataHaven Testnet",
    nativeCurrency: {
        name: "Mock",
        symbol: "MOCK",
        decimals: 18,
    },
    rpcUrls: ["https://services.datahaven-testnet.network/testnet"],
};


// --- Blockchain State ---
let state = {
    isConnected: false,
    userAddress: null,
    provider: null,
    signer: null,
};

// --- State Management ---
function dispatchStateChange() {
    // This event notifies other parts of the app (like roulette.js) about changes.
    document.dispatchEvent(new CustomEvent('blockchainstatechange', { detail: { ...state } }));
}

// --- Network Management ---
async function switchOrAddNetwork(provider) {
    try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: DATAHAVEN_TESTNET_CONFIG.chainId }]);
    } catch (switchError) {
        if (switchError.code === 4902) { // Network not added
            try {
                await provider.send("wallet_addEthereumChain", [DATAHAVEN_TESTNET_CONFIG]);
            } catch (addError) {
                console.error("Failed to add DataHaven Testnet:", addError);
                throw new Error("Could not add DataHaven Testnet to your wallet.");
            }
        } else {
            console.error("Failed to switch network:", switchError);
            throw new Error("Could not switch to DataHaven Testnet. Please try again.");
        }
    }
}

// --- Core Functions ---

export async function connect() {
    if (!window.ethereum) {
        alert("MetaMask not found. Please install it to continue.");
        return;
    }

    try {
        // 1. Create a provider
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

        // 2. Ensure the user is on the correct network
        await switchOrAddNetwork(provider);

        // 3. Request account access
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        // 4. Update state
        state.isConnected = true;
        state.userAddress = address;
        state.provider = provider;
        state.signer = signer;

        dispatchStateChange();
        console.log("Successfully connected to wallet:", address);

    } catch (error) {
        console.error("Failed to connect wallet:", error);
        alert(error.message || "An unexpected error occurred during connection.");
    }
}

export function disconnect() {
    state = {
        isConnected: false,
        userAddress: null,
        provider: null,
        signer: null,
    };
    dispatchStateChange();
    console.log("Disconnected from wallet.");
}

// --- Contract Interaction ---

export async function mintNFT(metadataUri) {
    if (!state.signer) throw new Error("Wallet not connected or signer not available.");

    console.log(`Initiating mint for metadata: ${metadataUri}`);

    try {
        const response = await fetch('/api/mint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ metadataUri }), // Sending metadata in the request body
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('API Error:', result.error || result.message);
            throw new Error(result.message || 'Failed to mint NFT.');
        }

        console.log('Minting process initiated:', result.message);
        // The backend now handles the blockchain interaction.
        // The response from the backend could include a transaction hash or other info.
        return result.output; // Or a more specific identifier from the backend response

    } catch (error) {
        console.error("Error calling mint API:", error);
        throw error; // Re-throw the error to be caught by the caller in roulette.js
    }
}


export async function fetchInventory(address) {
    if (!state.provider) throw new Error("Wallet not connected or provider not available.");

    console.log(`Fetching inventory for ${address}...`);
     // In a real scenario, you would interact with the contract's read functions.
    return [
        { name: 'Cardano', image: 'assets/cardano.png', mintNumber: 1, timestamp: Date.now() - 100000 },
        { name: 'Ethereum', image: 'assets/ethereum.png', mintNumber: 2, timestamp: Date.now() - 200000 },
    ];
}

// Getter for other scripts to access the current state
export function getState() {
    return { ...state };
}
