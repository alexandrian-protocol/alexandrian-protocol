// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/** M2: ERC-165 interface detection (lean). */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
