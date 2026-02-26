import { Wallet } from 'ethers';

const MSP_URL = 'https://msp-test.datahaven.com';

const getMspInfo = async () => {
  const response = await fetch(`${MSP_URL}/v1/msp/info`);
  const data = await response.json();
  return data;
};

const authenticateUser = async (wallet) => {
  const response = await fetch(`${MSP_URL}/v1/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: wallet.address }),
  });
  const { challenge } = await response.json();

  const signature = await wallet.signMessage(challenge);

  const authResponse = await fetch(`${MSP_URL}/v1/auth/response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: wallet.address, signature }),
  });

  const { token } = await authResponse.json();
  return token;
};

export { getMspInfo, authenticateUser };
