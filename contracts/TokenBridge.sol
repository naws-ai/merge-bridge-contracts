// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IERC20Metadata} from "./openzeppelin-contracts-5.0.0/token/ERC20/extensions/IERC20Metadata.sol";
import {ReentrancyGuard} from "./openzeppelin-contracts-5.0.0/utils/ReentrancyGuard.sol";

contract TokenBridge is ReentrancyGuard {
    IERC20Metadata public immutable sourceToken;
    
    constructor(address _sourceToken) {
        require(_sourceToken != address(0), "Invalid token address");
        sourceToken = IERC20Metadata(_sourceToken);

        // This bridge is designed to work only with tokens that have 18 decimals.
        // This ensures consistency in amount interpretation across chains.
        require(sourceToken.decimals() == 18, "Token must have 18 decimals");
    }

    /**
     * @notice IMPORTANT: Only events after 32 confirmations are considered valid for bridge processing
     * 
     * @param senderERC20Address    Sender address on Ethereum
     * @param receiverBEP20Address  Receiver address on BSC
     * @param amount                Amount of sourceToken
     */
    event Bridged(
        address indexed senderERC20Address,
        address indexed receiverBEP20Address, 
        uint256 amount
    );
    
    /**
     * @param receiverBEP20Address Receiver address on BSC
     */
    function bridge(address receiverBEP20Address) external nonReentrant {
        // CAUTION: This contract is designed for standard ERC20 tokens.
        // It may not be compatible with fee-on-transfer tokens, as the amount logged in the event
        // might differ from the actual amount locked in the contract.
        require(receiverBEP20Address != address(0), "Invalid BEP20 address");
        
        uint256 amount = sourceToken.balanceOf(msg.sender);
        require(amount > 0, "No token balance");
        
        uint256 allowance = sourceToken.allowance(msg.sender, address(this));
        require(allowance >= amount, "Insufficient allowance");

        require(sourceToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        emit Bridged(msg.sender, receiverBEP20Address, amount);
    }
} 