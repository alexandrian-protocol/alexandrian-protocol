// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @notice Minimal interface for AlexandrianRegistry to read KB for XANDER settlement.
 * @dev Must match Registry.getKnowledgeBlock return layout.
 */
interface IRegistryForXander {

    struct KnowledgeBlock {
        address curator;
        uint8 kbType;
        uint8 trustTier;
        string cid;
        string embeddingCid;
        string domain;
        string licenseType;
        uint256 queryFee;
        uint256 timestamp;
        string version;
        bool exists;
    }

    function getKnowledgeBlock(bytes32 contentHash) external view returns (KnowledgeBlock memory);
}
