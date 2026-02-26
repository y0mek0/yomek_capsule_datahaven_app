
import { Chain, defineChain } from 'viem';
import {
  createPublicClient,
  http,
  PublicClient,
} from 'viem';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';

// --- REMOVED ALL PRIVATE KEY AND WALLETCLIENT INITIALIZATION CODE FOR SECURITY ---

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

const chain: Chain = defineChain({
  id: NETWORKS.testnet.id,
  name: NETWORKS.testnet.name,
  nativeCurrency: NETWORKS.testnet.nativeCurrency,
  rpcUrls: { default: { http: [NETWORKS.testnet.rpcUrl] } },
});

const publicClient: PublicClient = createPublicClient({
  chain,
  transport: http(NETWORKS.testnet.rpcUrl),
});

// Create Polkadot API client
const provider = new WsProvider(NETWORKS.testnet.wsUrl);
const polkadotApi: ApiPromise = await ApiPromise.create({
  provider,
  typesBundle: types,
  noInitWarn: true,
});

// NOTE: WalletClient and StorageHubClient must now be created dynamically
// after connecting to a user's wallet (e.g., MetaMask).
// The hardcoded private key has been removed.

export {
  publicClient,
  polkadotApi,
  chain,
};
