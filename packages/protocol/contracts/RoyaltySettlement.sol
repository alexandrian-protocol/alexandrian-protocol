// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IKnowledgeRegistry.sol";
import "./interfaces/IRoyaltySettlement.sol";

/**
 * @title RoyaltySettlement
 * @notice Atomic fee distribution through the provenance DAG (V2).
 * @dev Curator gets curatorBps; remainder split equally among verified parents.
 */
contract RoyaltySettlement is IRoyaltySettlement, ReentrancyGuard {

    IKnowledgeRegistry public immutable registry;

    uint16 public constant BPS = 10000;
    uint16 public defaultCuratorBps = 8000;  // 80% to curator
    mapping(bytes32 => uint16) public curatorBps;  // per-KB override; 0 = use default

    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry");
        registry = IKnowledgeRegistry(_registry);
    }

    function setRoyaltyRatio(bytes32 _kbId, uint16 _curatorBps) external override {
        require(_curatorBps <= BPS, "BPS overflow");
        if (_kbId == bytes32(0)) {
            defaultCuratorBps = _curatorBps;
        } else {
            curatorBps[_kbId] = _curatorBps;
        }
    }

    function _getCuratorBps(bytes32 _kbId) internal view returns (uint16 bps) {
        bps = curatorBps[_kbId];
        if (bps == 0) bps = defaultCuratorBps;
    }

    function settleQuery(bytes32 _kbId) external payable override nonReentrant {
        if (msg.value == 0) return;
        IKnowledgeRegistry.KnowledgeBlock memory kb = registry.getKB(_kbId);
        require(kb.curator != address(0), "KB not registered");

        uint16 bps = _getCuratorBps(_kbId);
        uint256 curatorShare = (msg.value * bps) / BPS;
        uint256 remainder = msg.value - curatorShare;

        (bool sentCurator,) = payable(kb.curator).call{ value: curatorShare }("");
        require(sentCurator, "Curator transfer failed");
        emit RoyaltyDistributed(_kbId, kb.curator, curatorShare);

        if (remainder > 0 && kb.parents.length > 0) {
            uint256 verifiedCount = 0;
            for (uint256 i = 0; i < kb.parents.length; i++) {
                if (registry.isVerified(kb.parents[i])) verifiedCount++;
            }
            if (verifiedCount > 0) {
                uint256 perParent = remainder / verifiedCount;
                for (uint256 i = 0; i < kb.parents.length; i++) {
                    bytes32 parentId = kb.parents[i];
                    if (!registry.isVerified(parentId)) continue;
                    address parentCurator = registry.getCurator(parentId);
                    if (parentCurator == address(0)) continue;
                    (bool sent,) = payable(parentCurator).call{ value: perParent }("");
                    if (sent) emit RoyaltyDistributed(parentId, parentCurator, perParent);
                }
            }
        }
    }

    function calculateDistribution(bytes32 _kbId, uint256 _totalFee)
        external
        view
        override
        returns (address[] memory recipients, uint256[] memory amounts)
    {
        IKnowledgeRegistry.KnowledgeBlock memory kb = registry.getKB(_kbId);
        if (kb.curator == address(0)) return (recipients, amounts);

        uint16 bps = _getCuratorBps(_kbId);
        uint256 curatorShare = (_totalFee * bps) / BPS;
        uint256 remainder = _totalFee - curatorShare;

        uint256 verifiedCount = 0;
        if (remainder > 0 && kb.parents.length > 0) {
            for (uint256 i = 0; i < kb.parents.length; i++) {
                if (registry.isVerified(kb.parents[i])) verifiedCount++;
            }
        }

        uint256 n = verifiedCount > 0 ? 1 + verifiedCount : 1;
        recipients = new address[](n);
        amounts = new uint256[](n);
        recipients[0] = kb.curator;
        amounts[0] = curatorShare;

        if (verifiedCount > 0 && remainder > 0) {
            uint256 perParent = remainder / verifiedCount;
            uint256 j = 1;
            for (uint256 i = 0; i < kb.parents.length && j < n; i++) {
                if (!registry.isVerified(kb.parents[i])) continue;
                recipients[j] = registry.getCurator(kb.parents[i]);
                amounts[j] = perParent;
                j++;
            }
        }
    }
}
