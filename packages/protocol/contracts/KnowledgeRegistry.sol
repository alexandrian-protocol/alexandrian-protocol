// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IKnowledgeRegistry.sol";

/**
 * @title KnowledgeRegistry
 * @notice Immutable registration and lineage for Knowledge Blocks (V2).
 * @dev Uses contentHash as kbId: one canonical block per content.
 */
contract KnowledgeRegistry is IKnowledgeRegistry {

    mapping(bytes32 => KnowledgeBlock) private _blocks;

    event KBRegistered(bytes32 indexed kbId, address indexed curator, KBType artifactType, uint256 parentCount);

    function registerKB(
        bytes32 _contentHash,
        KBType _type,
        bytes32[] calldata _parents
    ) external override returns (bytes32 kbId) {
        require(_contentHash != bytes32(0), "Invalid contentHash");
        require(!isVerified(_contentHash), "Already registered");
        kbId = _contentHash;
        _blocks[kbId] = KnowledgeBlock({
            contentHash:   _contentHash,
            curator:      msg.sender,
            timestamp:    block.timestamp,
            artifactType: _type,
            parents:      _parents
        });
        emit KBRegistered(kbId, msg.sender, _type, _parents.length);
        return kbId;
    }

    function getKB(bytes32 _kbId) external view override returns (KnowledgeBlock memory) {
        return _blocks[_kbId];
    }

    function isVerified(bytes32 _kbId) public view override returns (bool) {
        return _blocks[_kbId].curator != address(0);
    }

    function getCurator(bytes32 _kbId) external view override returns (address) {
        return _blocks[_kbId].curator;
    }
}
