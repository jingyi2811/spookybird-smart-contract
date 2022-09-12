import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners(); //get the account to deploy the contract

  console.log("Deploying contracts with the account:", deployer.address);

  const FactoryNFT = await hre.ethers.getContractFactory("SpookyBirdsCandy"); // Getting the Contract
  const factoryNFT = await FactoryNFT.deploy('http://SpookyBirdCandy/'); //deploying the contract

  await factoryNFT.deployed(); // waiting for the contract to be deployed

  console.log("FactoryNFT deployed to:", factoryNFT.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
