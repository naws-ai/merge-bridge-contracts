// SPDX-License-Identifier: MIT
// Flattened TokenBridge contract
// This file contains all dependencies in a single file for easy deployment

// ===== IERC20Metadata Interface =====
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity ^0.8.20;

import {IERC20} from "../IERC20.sol";

/**
 * @dev Interface for the optional metadata functions from the ERC20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


// ===== ReentrancyGuard =====
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// ===== TokenBridge Contract =====
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