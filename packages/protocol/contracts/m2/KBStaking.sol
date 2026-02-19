// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IKnowledgeRegistry.sol";
import "./IKBStaking.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KBStaking (M2)
 * @notice Curator stake per KB; slash 10% to protocol on deprecation.
 */
contract KBStaking is IKBStaking, Ownable, ReentrancyGuard {
    IKnowledgeRegistry public immutable registry;
    address public immutable registryContract;
    mapping(bytes32 => uint256) public stakes;
    uint256 public protocolFees;
    event StakeSlashed(bytes32 indexed kbId, address indexed curator, uint256 amount);

    constructor(address _registry) Ownable(msg.sender) {
        require(_registry != address(0), "KBStaking: zero registry");
        registry = IKnowledgeRegistry(_registry);
        registryContract = _registry;
    }

    function stakeKB(bytes32 _kbId) external payable nonReentrant {
        require(registry.isVerified(_kbId), "KBStaking: KB not registered");
        require(msg.value > 0, "KBStaking: zero amount");
        stakes[_kbId] += msg.value;
    }

    function onDeprecation(bytes32 _kbId, address _curator) external override {
        require(msg.sender == registryContract, "Only registry");
        uint256 stakedAmount = stakes[_kbId];
        if (stakedAmount == 0) return;
        uint256 slash = stakedAmount / 10;
        stakes[_kbId] = stakedAmount - slash;
        protocolFees += slash;
        emit StakeSlashed(_kbId, _curator, slash);
    }

    function withdrawProtocolFees(address payable _to) external onlyOwner nonReentrant {
        require(_to != address(0), "KBStaking: zero address");
        uint256 amount = protocolFees;
        protocolFees = 0;
        (bool ok,) = _to.call{value: amount}("");
        require(ok, "KBStaking: transfer failed");
    }
}
