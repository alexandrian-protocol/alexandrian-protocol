// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IKBStaking (M2)
 * @notice Curator stake per KB; registry calls onDeprecation to slash on deprecation.
 */
interface IKBStaking {
    function onDeprecation(bytes32 _kbId, address _curator) external;
}
