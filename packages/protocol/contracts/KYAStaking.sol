// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentRegistry.sol";
import "./interfaces/IStakingToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KYAStaking
 * @notice Know-Your-Agent staking: agents stake XANDER to participate.
 *         Extends AgentRegistry with stake deposits and slash mechanics.
 *
 * - stake(amount): Deposit XANDER (must approve first)
 * - unstake(amount): Withdraw staked XANDER
 * - slash(agent, amount): Burn slashed stake (slasher role)
 * - slashAndRedistribute(agent, amount, recipient): Slash and send to recipient (e.g. treasury)
 */
contract KYAStaking is AgentRegistry, Ownable, ReentrancyGuard {

    IStakingToken public immutable token;

    mapping(address => uint256) public stakes;
    uint256 public totalStaked;

    address public slasher;

    /// @notice Max slash as % of stake (basis points, e.g. 1000 = 10%). Enforced per slash call.
    uint256 public maxSlashPercentBps;

    event Staked(address indexed agent, uint256 amount);
    event Unstaked(address indexed agent, uint256 amount);
    event Slashed(address indexed agent, uint256 amount, bytes32 reason);
    event Redistributed(address indexed agent, uint256 amount, address indexed recipient, bytes32 reason);
    event SlasherUpdated(address indexed previousSlasher, address indexed newSlasher);

    modifier onlySlasher() {
        require(msg.sender == slasher || msg.sender == owner(), "KYAStaking: not slasher");
        _;
    }

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "KYAStaking: zero token address");
        token = IStakingToken(_token);
        slasher = msg.sender;
        maxSlashPercentBps = 5000; // 50% default cap per slash
    }

    /**
     * @notice Stake XANDER. Caller must approve this contract first.
     * @param amount Amount in wei (18 decimals).
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "KYAStaking: zero amount");

        stakes[msg.sender] += amount;
        totalStaked += amount;

        require(
            token.transferFrom(msg.sender, address(this), amount),
            "KYAStaking: transfer failed"
        );

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake XANDER.
     * @param amount Amount in wei.
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "KYAStaking: zero amount");
        require(stakes[msg.sender] >= amount, "KYAStaking: insufficient stake");

        stakes[msg.sender] -= amount;
        totalStaked -= amount;

        require(token.transfer(msg.sender, amount), "KYAStaking: transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Slash an agent's stake and burn the tokens.
     * @param agent  Agent to slash.
     * @param amount Amount to slash.
     * @param reason Optional reason identifier (e.g. keccak256("invalid_proof")).
     */
    function slash(
        address agent,
        uint256 amount,
        bytes32 reason
    ) external onlySlasher nonReentrant {
        require(amount > 0, "KYAStaking: zero amount");
        require(stakes[agent] >= amount, "KYAStaking: insufficient stake");
        uint256 cap = (stakes[agent] * maxSlashPercentBps) / 10000;
        require(amount <= cap, "KYAStaking: exceeds slash cap");

        stakes[agent] -= amount;
        totalStaked -= amount;

        token.burn(amount);

        emit Slashed(agent, amount, reason);
    }

    /**
     * @notice Slash an agent's stake and redistribute to a recipient (e.g. treasury).
     * @param agent     Agent to slash.
     * @param amount    Amount to slash.
     * @param recipient Address to receive the slashed tokens.
     * @param reason    Optional reason identifier.
     */
    function slashAndRedistribute(
        address agent,
        uint256 amount,
        address recipient,
        bytes32 reason
    ) external onlySlasher nonReentrant {
        require(amount > 0, "KYAStaking: zero amount");
        require(stakes[agent] >= amount, "KYAStaking: insufficient stake");
        require(recipient != address(0), "KYAStaking: zero recipient");
        uint256 cap = (stakes[agent] * maxSlashPercentBps) / 10000;
        require(amount <= cap, "KYAStaking: exceeds slash cap");

        stakes[agent] -= amount;
        totalStaked -= amount;

        require(token.transfer(recipient, amount), "KYAStaking: transfer failed");

        emit Redistributed(agent, amount, recipient, reason);
    }

    /**
     * @notice Get an agent's staked balance.
     */
    function getStake(address agent) external view returns (uint256) {
        return stakes[agent];
    }

    /**
     * @notice Set max slash cap (basis points of stake, e.g. 5000 = 50%).
     */
    function setMaxSlashPercentBps(uint256 _bps) external onlyOwner {
        require(_bps <= 10000, "KYAStaking: bps > 10000");
        maxSlashPercentBps = _bps;
    }

    /**
     * @notice Set the slasher address (can call slash / slashAndRedistribute).
     */
    function setSlasher(address _slasher) external onlyOwner {
        address old = slasher;
        slasher = _slasher;
        emit SlasherUpdated(old, _slasher);
    }
}
