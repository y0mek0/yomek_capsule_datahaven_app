import { Wallet, WebSocketProvider } from 'ethers';

const createClient = (providerUrl, privateKey) => {
  const provider = new WebSocketProvider(providerUrl);
  const wallet = new Wallet(privateKey, provider);
  return { provider, wallet };
};

export { createClient };
