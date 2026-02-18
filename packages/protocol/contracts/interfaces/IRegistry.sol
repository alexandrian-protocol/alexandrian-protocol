// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRegistry {
    struct Record {
        address owner;
        string uri;
        bytes32 contentHash;
    }

    function register(bytes32 artifactId, string calldata uri, bytes32 contentHash) external;
    function getRecord(bytes32 artifactId) external view returns (Record memory);
}
