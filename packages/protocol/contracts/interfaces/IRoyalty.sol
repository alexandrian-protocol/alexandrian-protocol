// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRoyalty {
    function registerAsset(
        bytes32 assetId,
        address creator,
        uint256 baseRoyalty,
        bytes32[] memory parentIds,
        uint256[] memory parentShares
    ) external;

    function distributePayment(bytes32 assetId) external payable;
    function withdraw() external;
}
