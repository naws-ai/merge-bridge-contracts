# Bridge Contracts Boilerplate

bridge contract collection for **one-way, one-time token swap**.

## Project Overview

- Lightweight smart contract boilerplate design  
- Optimized gas cost implementation  
- Fully compliant with global security audit standards  

## Contract Analysis

- One-way migration bridge designed for rebranding purposes  
- Intentionally simple to minimize attack vectors  
- Full token balance transfer aligns with the migration/rebranding purpose  
- No withdrawal mechanism by design (source tokens are permanently locked)  
- Immutable contract state ensures a secure migration process  
- Event emission is sufficient for cross-chain verification  
- Bridge exclusively supports tokens with 18 decimals  
- **Security Note**: This contract is designed for standard ERC20 tokens only. It may not be compatible with fee-on-transfer tokens, as the amount logged in the event might differ from the actual amount locked in the contract.

## Security Testing

The project includes comprehensive security tests covering:
- Reentrancy attack prevention
- Fee-on-transfer token compatibility (with warnings)
- Transfer failure handling
- Edge case scenarios (zero amounts, large amounts)
- Gas limit testing
- Access control validation

Run security tests:
```
npm test test/TokenBridgeSecurity.test.ts
```

## Development

### Installation
```
npm install
```

### Compilation
```
npm run compile
```

### Testing
```
npm test                    # Run all tests
npm run test-flattened     # Flatten contract and run tests
```

### Building (Compile + Flatten + Test)
```
npm run build
```

### Contract Flattening
```
npm run flatten            # Generate flattened contract for deployment
```
The flattened contract will be saved to `flattened/TokenBridge.sol` and includes all dependencies in a single file for easy deployment.

## On-chain info

#### eth mainnet bridge
`TO BE DEPLOYED'

#### eth mainnet APM
[Etherscan](https://etherscan.io/token/0xC8C424B91D8ce0137bAB4B832B7F7D154156BA6c#code)
`0xC8C424B91D8ce0137bAB4B832B7F7D154156BA6c`

#### bsc mainnet NAWS
[Bscscan](https://bscscan.com/token/0x726a54E04f394b6e44e58a2D7CB0fEc61361D10E#code)
`0x726a54E04f394b6e44e58a2D7CB0fEc61361D10E`

