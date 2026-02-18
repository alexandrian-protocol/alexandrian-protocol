// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStakeManager
 * @notice Manages XANDER collateral and Knowledge Yield Account (KYA) integrity.
 * @dev Per-curator staking with per-KB allocation. Curators maintain a stake pool;
 *      each KB is "anchored" by allocating from that pool. Separates economic risk
 *      from the KnowledgeRegistry for Milestone 1.
 */
interface IStakeManager {

    struct StakeRecord {
        uint256 amount;       // Total XANDER staked in curator's pool
        uint256 allocated;    // Sum allocated to KBs (amount - allocated = withdrawable)
        uint256 lockedUntil;  // KYA lock period
        bool    slashed;      // Under slashing / penalized
    }

    /**
     * @notice Adds stake to the caller's curator pool.
     * @dev For ETH: use { value: _amount }. For ERC20: implementation pulls via transferFrom.
     */
    function addStake(uint256 _amount) external payable;

    /**
     * @notice Withdraws stake after the lock period. Only unallocated amount.
     */
    function withdrawStake(uint256 _amount) external;

    /**
     * @notice Allocates stake from the curator's pool to a specific KB (anchor).
     * @dev Caller must be the curator of _kbId per IKnowledgeRegistry.
     */
    function allocateStake(bytes32 _kbId, uint256 _amount) external;

    /**
     * @notice Deallocates stake from a KB, returning it to the curator's pool.
     */
    function deallocateStake(bytes32 _kbId) external;

    /**
     * @notice Executes a slashing event based on verified failure.
     * @dev Bounded by the curator's total staked collateral.
     */
    function slash(address _curator, uint256 _penalty, string calldata _reason) external;

    /**
     * @notice Checks if a KB has sufficient allocated stake to be considered "active".
     */
    function isStaked(bytes32 _kbId) external view returns (bool);

    /**
     * @notice Gets the full StakeRecord for a curator.
     */
    function getStakeRecord(address _curator) external view returns (StakeRecord memory);

    /**
     * @notice Gets the allocation amount for a specific KB.
     */
    function getKBAllocation(bytes32 _kbId) external view returns (uint256);
}
