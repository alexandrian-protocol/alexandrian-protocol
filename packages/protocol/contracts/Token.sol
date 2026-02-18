// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title XanderToken
 * @notice XANDER — the utility token for Alexandrian Protocol.
 *
 * Standard OpenZeppelin ERC-20 with:
 *   - transfer()         ✅ inherited from ERC20
 *   - approve()          ✅ inherited from ERC20
 *   - transferFrom()     ✅ inherited from ERC20
 *   - mint()             only callable by owner (deployer / API server wallet)
 *   - burn()             callable by any holder on their own balance
 *
 * For v1 the owner is the deployer wallet. In v2 ownership can be
 * transferred to a governance contract.
 */
contract XanderToken is ERC20, Ownable {

    uint8 private constant _DECIMALS = 18;

    // 1 billion XANDER total supply ceiling (not minted at once —
    // owner mints to wallets as needed during development / testnet)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** _DECIMALS;

    uint256 public totalMinted;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    constructor() ERC20("Xander", "XANDER") Ownable(msg.sender) {}

    /**
     * @notice Mint XANDER to an address.
     * @dev Only callable by owner. Respects MAX_SUPPLY ceiling.
     * @param to     Recipient address.
     * @param amount Amount in wei (18 decimals).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(totalMinted + amount <= MAX_SUPPLY, "Exceeds max supply");

        totalMinted += amount;
        _mint(to, amount);

        emit Minted(to, amount);
    }

    /**
     * @notice Burn XANDER from the caller's own balance.
     * @param amount Amount in wei (18 decimals).
     */
    function burn(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /**
     * @notice Burn XANDER from another address (requires allowance).
     * Used by the protocol for slash mechanics in v2.
     * @param from   Address to burn from.
     * @param amount Amount in wei.
     */
    function burnFrom(address from, uint256 amount) external {
        uint256 allowed = allowance(from, msg.sender);
        require(allowed >= amount, "Insufficient allowance");
        _approve(from, msg.sender, allowed - amount);
        _burn(from, amount);
        emit Burned(from, amount);
    }

    /**
     * @notice Helper: returns a human-readable balance (no decimals).
     * Useful for the demo script output.
     */
    function balanceOfXander(address account) external view returns (uint256) {
        return balanceOf(account) / 10 ** _DECIMALS;
    }
}
