// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract TestMaliciousToken {
    address public bridge;
    bool public reentrancyAttempted = false;
    
    constructor(address _bridge) {
        bridge = _bridge;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (to == bridge && !reentrancyAttempted) {
            reentrancyAttempted = true;
            // Try to reenter the bridge
            (bool success,) = bridge.call(abi.encodeWithSignature("bridge(address)", from));
            return success;
        }
        return true;
    }
    
    // Other ERC20 functions (simplified)
    function balanceOf(address) external pure returns (uint256) { return 1000; }
    function allowance(address, address) external pure returns (uint256) { return 1000; }
    function decimals() external pure returns (uint8) { return 18; }
    function approve(address, uint256) external pure returns (bool) { return true; }
}
