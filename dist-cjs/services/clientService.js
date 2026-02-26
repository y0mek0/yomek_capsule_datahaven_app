"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.polkadotApi = exports.storageHubClient = exports.walletClient = exports.publicClient = exports.address = exports.account = void 0;
const accounts_1 = require("viem/accounts");
const viem_1 = require("viem");
const viem_2 = require("viem");
const core_1 = require("@storagehub-sdk/core");
const api_1 = require("@polkadot/api");
const types_bundle_1 = require("@storagehub/types-bundle");
const account = (0, accounts_1.privateKeyToAccount)('0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133');
exports.account = account;
const address = account.address;
exports.address = address;
const NETWORKS = {
    devnet: {
        id: 181222,
        name: 'DataHaven Local Devnet',
        rpcUrl: 'http://127.0.0.1:9666',
        wsUrl: 'ws://127.0.0.1:9944',
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
const chain = (0, viem_1.defineChain)({
    id: NETWORKS.devnet.id,
    name: NETWORKS.devnet.name,
    nativeCurrency: NETWORKS.devnet.nativeCurrency,
    rpcUrls: { default: { http: [NETWORKS.devnet.rpcUrl] } },
});
const walletClient = (0, viem_2.createWalletClient)({
    chain,
    account,
    transport: (0, viem_2.http)(NETWORKS.devnet.rpcUrl),
});
exports.walletClient = walletClient;
const publicClient = (0, viem_2.createPublicClient)({
    chain,
    transport: (0, viem_2.http)(NETWORKS.devnet.rpcUrl),
});
exports.publicClient = publicClient;
// Create StorageHub client
const storageHubClient = new core_1.StorageHubClient({
    rpcUrl: NETWORKS.devnet.rpcUrl,
    chain: chain,
    walletClient: walletClient,
    filesystemContractAddress: '0x0000000000000000000000000000000000000404',
});
exports.storageHubClient = storageHubClient;
// Create Polkadot API client
const provider = new api_1.WsProvider(NETWORKS.devnet.wsUrl);
const polkadotApi = await api_1.ApiPromise.create({
    provider,
    typesBundle: types_bundle_1.types,
    noInitWarn: true,
});
exports.polkadotApi = polkadotApi;
