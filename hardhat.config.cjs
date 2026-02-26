require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    amoy: {
      url: "https://polygon-amoy-bor-rpc.publicnode.com",
      accounts: [process.env.PRIVATE_KEY]
    },
    datahaven: {
      url: "https://rpc.datahaven.rs/",
      accounts: [process.env.PRIVATE_KEY]
    }
  },
};
