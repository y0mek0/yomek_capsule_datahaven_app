import { Network } from 'hardhat/types';

const FHEVM_CONTRACT_ADDRESS = '0x00000000000000000000000000000000000000A1';

export const getFhevmContractAddress = (network: Network) => {
  if (network.config.chainId === 9090 || network.config.chainId === 31337) {
    return FHEVM_CONTRACT_ADDRESS;
  }
  throw new Error('FHEVM contract address not found for this network');
};
