// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract TestFeeOnTransferToken {
    uint8 private _decimals = 18;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 fee = amount / 100; // 1% fee
        uint256 actualAmount = amount - fee;
        
        _balances[from] -= amount;
        _balances[to] += actualAmount;
        _balances[address(this)] += fee; // Fee goes to contract
        
        return true;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function decimals() external view returns (uint8) {
        return _decimals;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
}
