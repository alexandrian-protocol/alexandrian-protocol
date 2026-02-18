// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IKnowledgeRegistry
 * @notice Interface for the Alexandrian Protocol Layer 0 Registry.
 * @dev Handles immutable registration and lineage tracking of Knowledge Blocks.
 *      Separation of concerns: Registry cares about existence and lineage ("What").
 *      Economics (BPS, fees) live in IRoyaltySettlement ("How").
 */
interface IKnowledgeRegistry {

    enum KBType {
        Practice,
        Feature,
        StateMachine,
        PromptEngineering,
        ComplianceChecklist,
        Rubric
    }

    struct KnowledgeBlock {
        bytes32 contentHash;   // CID anchor for IPFS storage
        address curator;       // Identity of the publisher
        uint256 timestamp;     // Registration time
        KBType artifactType;   // One of the 6 v1 schemas
        bytes32[] parents;     // Lineage for the Provenance Graph
    }

    /**
     * @notice Registers a new Knowledge Block and anchors it to the Provenance Graph.
     * @param _contentHash The IPFS content hash / CID anchor.
     * @param _type The specific KB schema type.
     * @param _parents Array of parent KB hashes to track derivation.
     * @return kbId The unique identifier for the registered block.
     */
    function registerKB(
        bytes32 _contentHash,
        KBType _type,
        bytes32[] calldata _parents
    ) external returns (bytes32 kbId);

    /**
     * @notice Retrieves the full metadata for a registered block.
     */
    function getKB(bytes32 _kbId) external view returns (KnowledgeBlock memory);

    /**
     * @notice Verifies if a piece of knowledge is registered and immutable.
     */
    function isVerified(bytes32 _kbId) external view returns (bool);

    /**
     * @notice Returns the curator address for a registered KB.
     */
    function getCurator(bytes32 _kbId) external view returns (address);
}
