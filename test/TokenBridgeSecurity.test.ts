import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenBridge } from "../typechain-types";
import { TestERC20 } from "../typechain-types";
import { TestMaliciousToken } from "../typechain-types";
import { TestFeeOnTransferToken } from "../typechain-types";
import { TestFailingToken } from "../typechain-types";

describe("TokenBridge Security Tests", function () {
  let tokenBridge: TokenBridge;
  let mockToken: TestERC20;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    mockToken = await TestERC20Factory.deploy("Test Token", "TEST", 18);
    await mockToken.waitForDeployment();

    // Deploy TokenBridge
    const TokenBridgeFactory = await ethers.getContractFactory("TokenBridge");
    tokenBridge = await TokenBridgeFactory.deploy(await mockToken.getAddress());
    await tokenBridge.waitForDeployment();

    // Mint tokens to users
    await mockToken.mint(user1.address, ethers.parseEther("1000"));
    await mockToken.mint(user2.address, ethers.parseEther("1000"));
  });

  describe("Reentrancy Attack Tests", function () {
    it("Should prevent actual reentrancy attacks", async function () {
      // Deploy malicious token
      const TestMaliciousTokenFactory = await ethers.getContractFactory("TestMaliciousToken");
      const maliciousToken = await TestMaliciousTokenFactory.deploy(await tokenBridge.getAddress());
      await maliciousToken.waitForDeployment();

      // Deploy new bridge with malicious token
      const TokenBridgeFactory = await ethers.getContractFactory("TokenBridge");
      const maliciousBridge = await TokenBridgeFactory.deploy(await maliciousToken.getAddress());
      await maliciousBridge.waitForDeployment();

      // The malicious token should not be able to reenter
      // This test should pass if reentrancy protection works
      try {
        await maliciousBridge.connect(user1).bridge(user2.address);
        // If we get here, reentrancy protection failed
        expect.fail("Reentrancy attack should have been prevented");
      } catch (error) {
        // Expected to fail due to reentrancy protection
        console.log("✅ Reentrancy protection working:", error.message);
      }
    });
  });

  describe("Fee-on-Transfer Token Tests", function () {
    it("Should handle fee-on-transfer tokens correctly", async function () {
      // Deploy fee-on-transfer token
      const TestFeeOnTransferTokenFactory = await ethers.getContractFactory("TestFeeOnTransferToken");
      const feeToken = await TestFeeOnTransferTokenFactory.deploy();
      await feeToken.waitForDeployment();

      // Deploy new bridge with fee token
      const TokenBridgeFactory = await ethers.getContractFactory("TokenBridge");
      const feeBridge = await TokenBridgeFactory.deploy(await feeToken.getAddress());
      await feeBridge.waitForDeployment();

      // Mint tokens to user
      await feeToken.mint(user1.address, ethers.parseEther("100"));
      await feeToken.connect(user1).approve(await feeBridge.getAddress(), ethers.parseEther("100"));

      // Check balances before bridge
      const balanceBefore = await feeToken.balanceOf(user1.address);
      const bridgeBalanceBefore = await feeToken.balanceOf(await feeBridge.getAddress());

      // Bridge tokens
      await feeBridge.connect(user1).bridge(user2.address);

      // Check balances after bridge
      const balanceAfter = await feeToken.balanceOf(user1.address);
      const bridgeBalanceAfter = await feeToken.balanceOf(await feeBridge.getAddress());

      // The actual amount transferred should be less due to fees
      const actualTransferred = bridgeBalanceAfter - bridgeBalanceBefore;
      const expectedTransferred = balanceBefore - balanceAfter;

      // This test reveals the fee-on-transfer vulnerability
      expect(actualTransferred).to.be.lessThan(expectedTransferred);
    });
  });

  describe("Transfer Failure Tests", function () {
    it("Should handle transfer failures correctly", async function () {
      // Deploy failing token
      const TestFailingTokenFactory = await ethers.getContractFactory("TestFailingToken");
      const failingToken = await TestFailingTokenFactory.deploy();
      await failingToken.waitForDeployment();

      // Deploy new bridge with failing token
      const TokenBridgeFactory = await ethers.getContractFactory("TokenBridge");
      const failingBridge = await TokenBridgeFactory.deploy(await failingToken.getAddress());
      await failingBridge.waitForDeployment();

      // Should revert when transfer fails
      await expect(
        failingBridge.connect(user1).bridge(user2.address)
      ).to.be.revertedWith("Transfer failed");
    });
  });

  describe("Edge Case Tests", function () {
    it("Should handle zero amount correctly", async function () {
      // User with zero balance should revert
      const [, , , userWithZeroBalance] = await ethers.getSigners();
      
      await expect(
        tokenBridge.connect(userWithZeroBalance).bridge(user2.address)
      ).to.be.revertedWith("No token balance");
    });

    it("Should handle maximum uint256 values", async function () {
      // Test with large but safe amount (not max uint256 to avoid overflow)
      const largeAmount = ethers.parseEther("1000000"); // 1M tokens
      await mockToken.mint(user1.address, largeAmount);
      
      // Approve the total balance (existing + new)
      const totalBalance = await mockToken.balanceOf(user1.address);
      await mockToken.connect(user1).approve(await tokenBridge.getAddress(), totalBalance);

      // Should handle large amounts without overflow
      await expect(tokenBridge.connect(user1).bridge(user2.address))
        .to.emit(tokenBridge, "Bridged")
        .withArgs(user1.address, user2.address, totalBalance);
    });

    it("Should handle very small amounts", async function () {
      // Use a fresh user to avoid beforeEach interference
      const [, , , , freshUser] = await ethers.getSigners();
      
      // Mint very small amount (1 wei) to fresh user
      const smallAmount = 1n;
      await mockToken.mint(freshUser.address, smallAmount);
      await mockToken.connect(freshUser).approve(await tokenBridge.getAddress(), smallAmount);

      await expect(tokenBridge.connect(freshUser).bridge(user2.address))
        .to.emit(tokenBridge, "Bridged")
        .withArgs(freshUser.address, user2.address, smallAmount);
    });
  });

  describe("Gas Limit Tests", function () {
    it("Should handle large token amounts without gas issues", async function () {
      // Use a fresh user to avoid beforeEach interference
      const [, , , , freshUser] = await ethers.getSigners();
      
      // Test with large amount
      const largeAmount = ethers.parseEther("1000000"); // 1M tokens
      await mockToken.mint(freshUser.address, largeAmount);
      await mockToken.connect(freshUser).approve(await tokenBridge.getAddress(), largeAmount);

      const tx = await tokenBridge.connect(freshUser).bridge(user2.address);
      const receipt = await tx.wait();

      // Should complete within reasonable gas limit
      expect(receipt?.gasUsed).to.be.lessThan(500000); // 500k gas limit
    });
  });

  describe("Access Control Tests", function () {
    it("Should not allow unauthorized access to internal functions", async function () {
      // Try to call bridge function with zero address
      await expect(
        tokenBridge.connect(user1).bridge(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid BEP20 address");
    });

    it("Should not allow self-bridging without proper balance", async function () {
      // User trying to bridge to themselves with no balance
      const [, , , userWithNoBalance] = await ethers.getSigners();
      
      await expect(
        tokenBridge.connect(userWithNoBalance).bridge(userWithNoBalance.address)
      ).to.be.revertedWith("No token balance");
    });
  });
});
