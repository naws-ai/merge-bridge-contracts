const { task } = require("hardhat/config");
const fs = require("fs");
const path = require("path");

task("flatten", "Flattens and prints contracts and their dependencies")
  .setAction(async () => {
    const contractsPath = path.join(__dirname, "..", "contracts");
    
    // Flatten TokenBridge.sol
    console.log("Flattening TokenBridge.sol...");
    const flattenedBridge = await hre.run("flatten:get-flattened-sources", {
      files: [path.join(contractsPath, "TokenBridge.sol")],
    });
    fs.writeFileSync(
      path.join(__dirname, "..", "flattened", "TokenBridge.sol"),
      flattenedBridge
    );

    console.log("Flattened contracts saved in 'flattened' directory");
  }); 