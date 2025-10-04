import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying FreelanceMarketplace...");
  const FreelanceMarketplace = await hre.ethers.getContractFactory("FreelanceMarketplace");
  const marketplace = await FreelanceMarketplace.deploy();
  await marketplace.waitForDeployment();
  const address = await marketplace.getAddress();
  console.log("FreelanceMarketplace deployed to:", address);

  // --- This is the new part that saves the file ---
  console.log("Saving contract info to the frontend...");
  const contractData = {
    address: address,
    abi: JSON.parse(marketplace.interface.formatJson())
  };

  const contractsDir = "../frontend/src/contracts";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    `${contractsDir}/FreelanceMarketplace.json`,
    JSON.stringify(contractData, null, 2)
  );
  console.log("Successfully saved contract info to frontend/src/contracts/");
  // --- End of new part ---
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});