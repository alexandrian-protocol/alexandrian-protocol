// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EpochCommit
 * @notice Stores Merkle root of royalty ledger balances per epoch (no settlement logic).
 *         API calls commitEpoch(merkleRoot) after computing root from Redis ledger.
 */
contract EpochCommit is Ownable {
    uint256 public currentEpoch;
    mapping(uint256 => bytes32) public epochRoots;

    event EpochCommitted(uint256 indexed epoch, bytes32 merkleRoot);

    constructor() Ownable(msg.sender) {}

    function commitEpoch(bytes32 merkleRoot) external onlyOwner {
        epochRoots[currentEpoch] = merkleRoot;
        emit EpochCommitted(currentEpoch, merkleRoot);
        currentEpoch++;
    }
}
