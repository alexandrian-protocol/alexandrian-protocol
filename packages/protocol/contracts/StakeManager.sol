// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IKnowledgeRegistry.sol";
import "./interfaces/IStakeManager.sol";

/**
 * @title StakeManager
 * @notice Per-curator stake pool with per-KB allocation (V2).
 * @dev ETH testnet: addStake is payable. Slashed funds remain in contract.
 */
contract StakeManager is IStakeManager, Ownable, ReentrancyGuard {

    IKnowledgeRegistry public immutable registry;

    uint256 public constant LOCK_PERIOD = 30 days;

    mapping(address => StakeRecord) private _stakes;
    mapping(bytes32 => uint256) private _allocations;
    mapping(bytes32 => address) private _allocationCurator;

    constructor(address _registry) Ownable(msg.sender) {
        require(_registry != address(0), "Invalid registry");
        registry = IKnowledgeRegistry(_registry);
    }

    receive() external payable {
        revert("Use addStake(uint256)");
    }

    function addStake(uint256 _amount) external payable override nonReentrant {
        require(msg.value == _amount && _amount > 0, "Amount mismatch");
        StakeRecord storage s = _stakes[msg.sender];
        s.amount += _amount;
        uint256 newLock = block.timestamp + LOCK_PERIOD;
        if (newLock > s.lockedUntil) s.lockedUntil = newLock;
    }

    function withdrawStake(uint256 _amount) external override nonReentrant {
        StakeRecord storage s = _stakes[msg.sender];
        require(block.timestamp >= s.lockedUntil, "Locked");
        uint256 free = s.amount - s.allocated;
        require(_amount <= free && _amount > 0, "Insufficient free");
        s.amount -= _amount;
        (bool sent,) = payable(msg.sender).call{ value: _amount }("");
        require(sent, "Transfer failed");
    }

    function allocateStake(bytes32 _kbId, uint256 _amount) external override nonReentrant {
        require(registry.getCurator(_kbId) == msg.sender, "Not curator");
        StakeRecord storage s = _stakes[msg.sender];
        uint256 free = s.amount - s.allocated;
        require(_amount <= free && _amount > 0, "Insufficient free");
        s.allocated += _amount;
        _allocations[_kbId] += _amount;
        if (_allocationCurator[_kbId] == address(0)) _allocationCurator[_kbId] = msg.sender;
    }

    function deallocateStake(bytes32 _kbId) external override nonReentrant {
        address curator = _allocationCurator[_kbId];
        require(curator == msg.sender, "Not allocator");
        uint256 amt = _allocations[_kbId];
        require(amt > 0, "No allocation");
        _allocations[_kbId] = 0;
        _allocationCurator[_kbId] = address(0);
        _stakes[msg.sender].allocated -= amt;
    }

    function slash(address _curator, uint256 _penalty, string calldata /* _reason */) external override onlyOwner {
        StakeRecord storage s = _stakes[_curator];
        require(s.amount > 0, "No stake");
        uint256 actual = _penalty > s.amount ? s.amount : _penalty;
        s.amount -= actual;
        s.slashed = true;
        // ETH remains in contract (treasury). _reason for event/indexing in extensions.
    }

    function isStaked(bytes32 _kbId) external view override returns (bool) {
        if (_allocations[_kbId] == 0) return false;
        address curator = _allocationCurator[_kbId];
        if (curator == address(0)) return false;
        return !_stakes[curator].slashed;
    }

    function getStakeRecord(address _curator) external view override returns (StakeRecord memory) {
        return _stakes[_curator];
    }

    function getKBAllocation(bytes32 _kbId) external view override returns (uint256) {
        return _allocations[_kbId];
    }
}
