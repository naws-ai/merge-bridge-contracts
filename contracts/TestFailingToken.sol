// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract TestFailingToken {
    uint8 private _decimals = 18;
    
    function transferFrom(address, address, uint256) external pure returns (bool) {
        return false; // Always fails
    }
    
    function balanceOf(address) external pure returns (uint256) { return 1000; }
    function allowance(address, address) external pure returns (uint256) { return 1000; }
    function decimals() external pure returns (uint8) { return 18; }
    function approve(address, uint256) external pure returns (bool) { return true; }
}
