// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRoyaltySettlement
 * @notice Interface for the Alexandrian Protocol's atomic settlement engine.
 * @dev Handles proportional payment routing through the intellectual lineage DAG.
 *      Royalty BPS and fee distribution live here (not in Registry).
 */
interface IRoyaltySettlement {

    event RoyaltyDistributed(bytes32 indexed kbId, address indexed contributor, uint256 amount);
    event SettlementFailed(bytes32 indexed kbId, string reason);

    /**
     * @notice Executes a settlement for a specific KB query.
     * @dev Must fetch parents from IKnowledgeRegistry to traverse the lineage.
     *      Atomic: pays curator + all ancestors in a single transaction.
     * @param _kbId The unique identifier of the Knowledge Block being consumed.
     */
    function settleQuery(bytes32 _kbId) external payable;

    /**
     * @notice Calculates the fee distribution for a KB and its ancestors.
     * @dev Used by the Architect Agent (Resolver) to estimate costs before execution.
     * @param _kbId The identifier of the KB.
     * @param _totalFee The total amount being paid for the query.
     * @return recipients Array of addresses in the lineage (curator + ancestors).
     * @return amounts Proportional shares for each recipient.
     */
    function calculateDistribution(bytes32 _kbId, uint256 _totalFee)
        external
        view
        returns (address[] memory recipients, uint256[] memory amounts);

    /**
     * @notice Configures the royalty split ratio for a KB or globally.
     * @param _kbId The KB to configure (or bytes32(0) for global defaults).
     * @param _curatorBps The percentage (in basis points) kept by the immediate curator.
     *                    Remainder flows to parent lineage.
     */
    function setRoyaltyRatio(bytes32 _kbId, uint16 _curatorBps) external;
}
