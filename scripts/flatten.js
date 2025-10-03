const fs = require("fs");
const path = require("path");

// Simple flattening script that manually combines files
function flattenContract() {
  const contractsPath = path.join(__dirname, "..", "contracts");
  const flattenedDir = path.join(__dirname, "..", "flattened");
  
  // Create flattened directory if it doesn't exist
  if (!fs.existsSync(flattenedDir)) {
    fs.mkdirSync(flattenedDir, { recursive: true });
  }
  
  console.log("Flattening TokenBridge.sol...");
  
  // Read TokenBridge.sol
  const tokenBridgePath = path.join(contractsPath, "TokenBridge.sol");
  let content = fs.readFileSync(tokenBridgePath, 'utf8');
  
  // Read ReentrancyGuard.sol
  const reentrancyGuardPath = path.join(contractsPath, "openzeppelin-contracts-5.0.0", "utils", "ReentrancyGuard.sol");
  const reentrancyGuardContent = fs.readFileSync(reentrancyGuardPath, 'utf8');
  
  // Read IERC20Metadata.sol
  const ierc20MetadataPath = path.join(contractsPath, "openzeppelin-contracts-5.0.0", "token", "ERC20", "extensions", "IERC20Metadata.sol");
  const ierc20MetadataContent = fs.readFileSync(ierc20MetadataPath, 'utf8');
  
  // Create flattened content
  let flattenedContent = `// SPDX-License-Identifier: MIT
// Flattened TokenBridge contract
// This file contains all dependencies in a single file for easy deployment

`;

  // Add IERC20Metadata interface
  flattenedContent += `// ===== IERC20Metadata Interface =====\n`;
  flattenedContent += ierc20MetadataContent.replace(/\/\/ SPDX-License-Identifier: MIT\n/, '');
  flattenedContent += `\n\n`;

  // Add ReentrancyGuard
  flattenedContent += `// ===== ReentrancyGuard =====\n`;
  flattenedContent += reentrancyGuardContent.replace(/\/\/ SPDX-License-Identifier: MIT\n/, '');
  flattenedContent += `\n\n`;

  // Add TokenBridge contract
  flattenedContent += `// ===== TokenBridge Contract =====\n`;
  flattenedContent += content.replace(/\/\/ SPDX-License-Identifier: MIT\n/, '');
  
  // Write flattened file
  fs.writeFileSync(
    path.join(flattenedDir, "TokenBridge.sol"),
    flattenedContent
  );
  
  console.log("✅ Flattened contract saved to 'flattened/TokenBridge.sol'");
  console.log("📁 File size:", (flattenedContent.length / 1024).toFixed(2), "KB");
}

// Run the flattening
flattenContract();
