// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/** M2: ERC-1271 contract signature validation (smart account / 4337). */
interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue);
}
