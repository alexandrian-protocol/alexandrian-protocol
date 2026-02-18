// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @notice Minimal interface for KYAStaking.
 * XanderToken implements transfer, transferFrom (ERC20) and burn(uint256).
 */
interface IStakingToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
}
