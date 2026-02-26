import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { createPublicClient, createWalletClient, http, } from 'viem';
import { StorageHubClient } from '@storagehub-sdk/core';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';
const account = privateKeyToAccount('0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133');
const address = account.address;
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
const chain = defineChain({
    id: NETWORKS.devnet.id,
    name: NETWORKS.devnet.name,
    nativeCurrency: NETWORKS.devnet.nativeCurrency,
    rpcUrls: { default: { http: [NETWORKS.devnet.rpcUrl] } },
});
const walletClient = createWalletClient({
    chain,
    account,
    transport: http(NETWORKS.devnet.rpcUrl),
});
const publicClient = createPublicClient({
    chain,
    transport: http(NETWORKS.devnet.rpcUrl),
});
// Create StorageHub client
const storageHubClient = new StorageHubClient({
    rpcUrl: NETWORKS.devnet.rpcUrl,
    chain: chain,
    walletClient: walletClient,
    filesystemContractAddress: '0x0000000000000000000000000000000000000404',
});
// Create Polkadot API client
const provider = new WsProvider(NETWORKS.devnet.wsUrl);
const polkadotApi = await ApiPromise.create({
    provider,
    typesBundle: types,
    noInitWarn: true,
});
export { account, address, publicClient, walletClient, storageHubClient, polkadotApi, };
