// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IKnowledgeRegistry.sol";
import "./interfaces/IRoyaltySettlement.sol";
import "./interfaces/IStakeManager.sol";

/**
 * @title AlexandriaRouter
 * @notice Central protocol router holding addresses for the V2 modular stack.
 * @dev Single source of truth for IKnowledgeRegistry, IRoyaltySettlement, IStakeManager.
 */
contract AlexandriaRouter is Ownable {

    IKnowledgeRegistry  public knowledgeRegistry;
    IRoyaltySettlement  public royaltySettlement;
    IStakeManager       public stakeManager;

    event RegistrySet(address indexed registry);
    event SettlementSet(address indexed settlement);
    event StakeManagerSet(address indexed stakeManager);

    constructor(
        address _knowledgeRegistry,
        address _royaltySettlement,
        address _stakeManager
    ) Ownable(msg.sender) {
        knowledgeRegistry  = IKnowledgeRegistry(_knowledgeRegistry);
        royaltySettlement  = IRoyaltySettlement(_royaltySettlement);
        stakeManager       = IStakeManager(_stakeManager);
    }

    function setKnowledgeRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "Invalid registry");
        knowledgeRegistry = IKnowledgeRegistry(_registry);
        emit RegistrySet(_registry);
    }

    function setRoyaltySettlement(address _settlement) external onlyOwner {
        require(_settlement != address(0), "Invalid settlement");
        royaltySettlement = IRoyaltySettlement(_settlement);
        emit SettlementSet(_settlement);
    }

    function setStakeManager(address _stakeManager) external onlyOwner {
        require(_stakeManager != address(0), "Invalid stake manager");
        stakeManager = IStakeManager(_stakeManager);
        emit StakeManagerSet(_stakeManager);
    }

    /**
     * @notice Convenience: resolve full stack for a KB (registry + stake status).
     */
    function getKBWithStakeStatus(bytes32 _kbId)
        external
        view
        returns (
            IKnowledgeRegistry.KnowledgeBlock memory kb,
            bool staked
        )
    {
        kb = knowledgeRegistry.getKB(_kbId);
        staked = stakeManager.isStaked(_kbId);
    }
}
