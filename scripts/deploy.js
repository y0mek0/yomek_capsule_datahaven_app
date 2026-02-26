async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Capsule = await ethers.getContractFactory("Capsule");
  console.log("Deploying Capsule...");
  const capsule = await Capsule.deploy(deployer.address);
  
  // In ethers v6, the deploy method waits for the deployment to be mined.
  // The .deployed() function is removed. The address is on .target
  await capsule.waitForDeployment();

  console.log("Capsule deployed to:", capsule.target);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
