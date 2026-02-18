// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentRegistry {
    struct Checkpoint {
        bytes32 stateRoot;
        uint256 timestamp;
        uint256 blockNumber;
        string version;
    }

    struct Proof {
        address submitter;
        uint256 timestamp;
        bytes signature;
    }

    function checkpoint(bytes32 stateRoot, string calldata version) external;
    function getCheckpoint(address agent, uint256 index) external view returns (Checkpoint memory);

    function submitProof(bytes32 agentId, bytes32 actionHash, bytes calldata signature) external;
    function verifyAction(bytes32 proofId) external view returns (bool);
}
