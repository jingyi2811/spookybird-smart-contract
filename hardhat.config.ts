import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  // gasReporter: {
  //   enabled: true,
  //   currency: 'USD',
  //   gasPrice: 21,
  //   coinmarketcap: '9369d435-ca90-48c9-a3d1-a7746552f6fa'
  // },
  // networks: {
  //   rinkeby: {
  //     url: "https://rinkeby.infura.io/v3/[infuraKey]",
  //     accounts: ["[privateKey]"]
  //   },
  // }
};

export default config;
