// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KnowledgeRegistryM2 (skeleton)
 * @notice M2 extensions to KnowledgeRegistry: query accumulator, deprecation, staking hook.
 * @dev Wire into main KnowledgeRegistry for M2 deployment:
 *      - queryCount, totalFeesEarned, settleQuery(bytes32 _kbId, address _agent) payable, event KBQueried
 *      - supersededBy, deprecated, deprecateKB(bytes32 _kbId, bytes32 _successor), event KBDeprecated
 *      - stakingContract, setStakingContract(address), call IKBStaking(stakingContract).onDeprecation(_kbId, msg.sender) in deprecateKB
 */
interface IKnowledgeRegistryM2 {
    function queryCount(bytes32) external view returns (uint256);
    function totalFeesEarned(bytes32) external view returns (uint256);
    function settleQuery(bytes32 _kbId, address _agent) external payable;
    function supersededBy(bytes32) external view returns (bytes32);
    function deprecated(bytes32) external view returns (bool);
    function deprecateKB(bytes32 _kbId, bytes32 _successor) external;
}
