// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IAgentRegistry.sol";

contract AgentRegistry is IAgentRegistry {
    mapping(address => Checkpoint[]) private agentHistory;
    mapping(bytes32 => Proof) public proofs;

    event CheckpointSubmitted(address indexed agent, bytes32 stateRoot, string version);
    event ProofSubmitted(bytes32 indexed proofId, bytes32 indexed agentId, bytes32 actionHash);

    function checkpoint(bytes32 stateRoot, string calldata version) external override {
        agentHistory[msg.sender].push(
            Checkpoint({
                stateRoot: stateRoot,
                timestamp: block.timestamp,
                blockNumber: block.number,
                version: version
            })
        );
        emit CheckpointSubmitted(msg.sender, stateRoot, version);
    }

    function getCheckpoint(address agent, uint256 index) external view override returns (Checkpoint memory) {
        return agentHistory[agent][index];
    }

    function submitProof(bytes32 agentId, bytes32 actionHash, bytes calldata signature) external override {
        bytes32 proofId = keccak256(abi.encodePacked(agentId, actionHash));
        proofs[proofId] = Proof({ submitter: msg.sender, timestamp: block.timestamp, signature: signature });
        emit ProofSubmitted(proofId, agentId, actionHash);
    }

    function verifyAction(bytes32 proofId) external view override returns (bool) {
        return proofs[proofId].timestamp > 0;
    }
}
