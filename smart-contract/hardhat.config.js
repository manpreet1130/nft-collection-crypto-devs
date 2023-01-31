require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */

const GOERLI_TESTNET_RPC_URL = process.env.GOERLI_TESTNET_RPC_URL;
const GOERLI_TESTNET_ACCOUNT_1 = process.env.GOERLI_TESTNET_ACCOUNT_1;  

module.exports = {
  solidity: "0.8.7",
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI_TESTNET_RPC_URL,
      accounts: [GOERLI_TESTNET_ACCOUNT_1],
      chainId: 5,
    }
  }
};