// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/** M2 optional: ERC-8004 agent registry alignment (identity-agnostic). */
interface IERC8004 {
    function supportsAgent(bytes32 agentId) external view returns (bool);
}
