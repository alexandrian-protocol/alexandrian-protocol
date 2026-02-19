// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRegistryForXander.sol";

/**
 * @title XanderQuerySettlement
 * @notice Settles query fees in XANDER (ERC-20). Agent approves this contract then calls settleQuery; curator and protocol receive XANDER.
 * @dev Reads KB metadata (curator, queryFee) from AlexandrianRegistry; does not update registry reputation (registry remains source of truth for KB state).
 */
contract XanderQuerySettlement is ReentrancyGuard {

    uint16 public constant PROTOCOL_FEE_BPS = 200;

    IERC20 public immutable token;
    IRegistryForXander public immutable registry;
    address public immutable treasury;

    event QuerySettledInXander(bytes32 indexed contentHash, address indexed querier, uint256 totalFee, uint256 protocolFee);

    constructor(address _registry, address _token, address _treasury) {
        require(_registry != address(0) && _token != address(0) && _treasury != address(0), "Invalid address");
        registry = IRegistryForXander(_registry);
        token = IERC20(_token);
        treasury = _treasury;
    }

    /**
     * @notice Settle a query fee in XANDER. Caller must have approved this contract for at least kb.queryFee.
     */
    function settleQuery(bytes32 contentHash, address querier) external nonReentrant {
        IRegistryForXander.KnowledgeBlock memory kb = registry.getKnowledgeBlock(contentHash);
        require(kb.exists, "KB not registered");
        require(kb.curator != address(0), "Invalid curator");
        require(kb.queryFee > 0, "Zero fee");

        uint256 protocolFee = (kb.queryFee * PROTOCOL_FEE_BPS) / 10000;
        uint256 toCurator = kb.queryFee - protocolFee;

        require(token.transferFrom(msg.sender, kb.curator, toCurator), "Curator transfer failed");
        if (protocolFee > 0) {
            require(token.transferFrom(msg.sender, treasury, protocolFee), "Protocol transfer failed");
        }

        emit QuerySettledInXander(contentHash, querier, kb.queryFee, protocolFee);
    }
}
