"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueProps = exports.getPaymentStreams = exports.authenticateUser = exports.getMspHealth = exports.getMspInfo = exports.mspClient = void 0;
const msp_client_1 = require("@storagehub-sdk/msp-client");
const clientService_js_1 = require("./clientService.js");
const NETWORKS = {
    devnet: {
        id: 181222,
        name: 'DataHaven Local Devnet',
        rpcUrl: 'http://127.0.0.1:9666',
        wsUrl: 'wss://127.0.0.1:9944',
        mspUrl: 'http://127.0.0.1:8080/',
        nativeCurrency: { name: 'StorageHub', symbol: 'SH', decimals: 18 },
    },
    testnet: {
        id: 55931,
        name: 'DataHaven Testnet',
        rpcUrl: 'https://services.datahaven-testnet.network/testnet',
        wsUrl: 'wss://services.datahaven-testnet.network/testnet',
        mspUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network/',
        nativeCurrency: { name: 'Mock', symbol: 'MOCK', decimals: 18 },
    },
};
// Configure the HTTP client to point to the MSP backend
const httpCfg = { baseUrl: NETWORKS.devnet.mspUrl };
// Initialize a session token for authenticated requests (updated after authentication
// through SIWE)
let sessionToken = undefined;
// Provide session information to the MSP client whenever available
// Returns a token and user address if authenticated, otherwise undefined
const sessionProvider = async () => sessionToken
    ? { token: sessionToken, user: { address: clientService_js_1.address } }
    : undefined;
// Establish a connection to the Main Storage Provider (MSP) backend
const mspClient = await msp_client_1.MspClient.connect(httpCfg, sessionProvider);
exports.mspClient = mspClient;
// Retrieve MSP metadata, including its unique ID and version, and log it to the console
const getMspInfo = async () => {
    const mspInfo = await mspClient.info.getInfo();
    console.log(`MSP ID: ${mspInfo.mspId}`);
    return mspInfo;
};
exports.getMspInfo = getMspInfo;
// Retrieve and log the MSP’s current health status
const getMspHealth = async () => {
    const mspHealth = await mspClient.info.getHealth();
    console.log(`MSP Health: ${mspHealth}`);
    return mspHealth;
};
exports.getMspHealth = getMspHealth;
// Authenticate the user via SIWE (Sign-In With Ethereum) using the connected wallet
// Once authenticated, store the returned session token and retrieve the user’s profile
const authenticateUser = async () => {
    console.log('Authenticating user with MSP via SIWE...');
    // In development domain and uri can be arbitrary placeholders,
    // but in production they must match your actual frontend origin.
    const domain = 'localhost';
    const uri = 'http://localhost';
    const siweSession = await mspClient.auth.SIWE(clientService_js_1.walletClient, domain, uri);
    console.log('SIWE Session:', siweSession);
    sessionToken = siweSession.token;
    const profile = await mspClient.auth.getProfile();
    return profile;
};
exports.authenticateUser = authenticateUser;
const getPaymentStreams = async () => {
    // Fetch payment streams associated with the authenticated user
    const paymentStreams = await mspClient.info.getPaymentStreams();
    return paymentStreams;
};
exports.getPaymentStreams = getPaymentStreams;
const getValueProps = async () => {
    const valueProps = await mspClient.info.getValuePropositions();
    if (!Array.isArray(valueProps) || valueProps.length === 0) {
        throw new Error('No value propositions available from MSP');
    }
    // For simplicity, select the first value proposition and return its ID
    const valuePropId = valueProps[0].id;
    console.log(`Chose Value Prop ID: ${valuePropId}`);
    return valuePropId;
};
exports.getValueProps = getValueProps;
