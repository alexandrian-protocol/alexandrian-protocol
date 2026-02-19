require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true  // fixes "stack too deep" in Registry.sol and complex contracts
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    docker: {
      url: process.env.CHAIN_RPC_URL || "http://blockchain:8545",
      chainId: 31337
    },
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      ...(process.env.BASE_SEPOLIA_GAS_PRICE && { gasPrice: parseInt(process.env.BASE_SEPOLIA_GAS_PRICE, 10) })
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      ...(process.env.SEPOLIA_GAS_PRICE && { gasPrice: parseInt(process.env.SEPOLIA_GAS_PRICE, 10) })
    }
  },
  paths: {
    sources: "./contracts",
    tests:   "./test",
    cache:   "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000,
    exit: true,
    reporter: "dot"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true"
  }
};