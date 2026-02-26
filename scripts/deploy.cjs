
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);

  const Capsule = await hre.ethers.getContractFactory("Capsule");
  const capsule = await Capsule.deploy(deployer.address);

  const receipt = await capsule.deploymentTransaction().wait();

  const contractAddress = await capsule.getAddress();
  const deploymentBlock = receipt.blockNumber

  console.log("Capsule deployed to:", contractAddress);
  console.log("Deployment block number:", deploymentBlock);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
