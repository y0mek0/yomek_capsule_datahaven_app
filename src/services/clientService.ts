
import 'dotenv/config';
import { Chain, defineChain } from 'viem';
import {
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';
import { StorageHubClient } from '@storagehub-sdk/core';

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is not set.');
}

const NETWORKS = {
  testnet: {
    id: 55931,
    name: 'DataHaven Testnet',
    rpcUrl: 'https://services.datahaven-testnet.network/testnet',
    wsUrl: 'wss://services.datahaven-testnet.network/testnet',
    mspUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network/',
    nativeCurrency: { name: 'Mock', symbol: 'MOCK', decimals: 18 },
  },
};

const chain: Chain = defineChain({
  id: NETWORKS.testnet.id,
  name: NETWORKS.testnet.name,
  nativeCurrency: NETWORKS.testnet.nativeCurrency,
  rpcUrls: { default: { http: [NETWORKS.testnet.rpcUrl] } },
});

// --- Accounts & Clients Initialization ---
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const address = account.address;

const walletClient: WalletClient = createWalletClient({
  account,
  chain,
  transport: http(NETWORKS.testnet.rpcUrl),
});

const publicClient: PublicClient = createPublicClient({
  chain,
  transport: http(NETWORKS.testnet.rpcUrl),
});

// --- Polkadot & StorageHub Client Initialization ---
const provider = new WsProvider(NETWORKS.testnet.wsUrl);
const polkadotApi: ApiPromise = await ApiPromise.create({
  provider,
  typesBundle: types,
  noInitWarn: true,
});

const storageHubClient = new StorageHubClient({ polkadotApi, walletClient });

export {
  publicClient,
  polkadotApi,
  chain,
  walletClient,
  address,
  account,
  storageHubClient,
};
