// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  AlexandrianRegistry
 * @notice Permanent record, provenance graph, and settlement engine
 *         for AI-native Knowledge Blocks.
 *
 * V1 extensions:
 *   - Typed Knowledge Blocks (6 artifact types)
 *   - XANDER staking per KB (ETH on testnet)
 *   - Royalty DAG with proportional attribution (basis points)
 *   - Atomic query fee settlement through the DAG
 *   - Deterministic reputation scoring (no hidden state)
 *   - Domain and type indexes for agent retrieval routing
 *
 * Existing Asset system is completely unchanged.
 */
contract AlexandrianRegistry is Ownable, ReentrancyGuard {

    // =========================================================================
    // ENUMERATIONS
    // =========================================================================

    enum KBType {
        Practice,            // 0
        Feature,             // 1
        StateMachine,        // 2
        PromptEngineering,   // 3
        ComplianceChecklist, // 4
        Rubric               // 5
    }

    enum TrustTier {
        HumanStaked,     // 0 — human curator, full accountability
        AgentDerived,    // 1 — derived from Tier 0 KBs
        AgentDiscovered  // 2 — novel agent content, probationary
    }

    // =========================================================================
    // STRUCTS — existing (unchanged)
    // =========================================================================

    struct Asset {
        bytes32   fingerprint;
        string    cid;
        address   creator;
        uint256   timestamp;
        uint256   blockNumber;
        License   license;
        bytes32[] parents;
        bool      active;
    }

    struct License {
        string licenseType;
        bool   commercialUse;
        bool   attribution;
        bool   shareAlike;
        bool   derivatives;
    }

    struct Provenance {
        bytes32 assetId;
        bytes32 parentId;
        uint256 depth;
        uint256 timestamp;
    }

    // =========================================================================
    // STRUCTS — V1
    // =========================================================================

    /**
     * @dev One edge in the royalty DAG.
     *      royaltyShareBps in basis points (1/10000).
     *      All shares for one KB must sum to <= (10000 - protocolFeesBps).
     */
    struct AttributionLink {
        bytes32 parentHash;
        uint16  royaltyShareBps;
        bytes4  relationship; // "derv" | "extd" | "ctrd" | "vald"
    }

    struct StakeRecord {
        uint256 amount;
        uint256 lockedUntil;
        bool    slashed;
    }

    struct ReputationRecord {
        uint32  queryVolume;
        uint32  positiveOutcomes;
        uint32  endorsements;
        uint16  score;          // 0-1000
        uint256 lastUpdated;
    }

    struct KnowledgeBlock {
        address   curator;
        KBType    kbType;
        TrustTier trustTier;
        string    cid;
        string    embeddingCid;
        string    domain;
        string    licenseType;
        uint256   queryFee;
        uint256   timestamp;
        string    version;
        bool      exists;
    }

    // =========================================================================
    // STATE — existing (unchanged)
    // =========================================================================

    mapping(bytes32 => Asset)        public assets;
    mapping(address => bytes32[])    public creatorAssets;
    mapping(bytes32 => Provenance[]) public provenanceGraph;

    // =========================================================================
    // STATE — V1
    // =========================================================================

    mapping(bytes32 => KnowledgeBlock)    public knowledgeBlocks;
    mapping(bytes32 => AttributionLink[]) public attributionDAG;
    mapping(bytes32 => StakeRecord)       public stakes;
    mapping(bytes32 => ReputationRecord)  public reputation;

    mapping(address => bytes32[]) public curatorBlocks;
    mapping(uint8   => bytes32[]) public blocksByType;
    mapping(bytes32 => bytes32[]) public blocksByDomain;
    mapping(bytes32 => bytes32[]) public derivedBlocks;

    uint256 public protocolFeesBps = 200;
    uint256 public slashRateBps    = 1000;
    uint256 public minStakeAmount  = 1e15;
    uint256 public treasuryBalance;

    // =========================================================================
    // EVENTS — existing (unchanged)
    // =========================================================================

    event AssetRegistered(bytes32 indexed assetId, bytes32 indexed fingerprint, string cid, address indexed creator, uint256 timestamp);
    event DerivationRegistered(bytes32 indexed derivedId, bytes32 indexed parentId, uint256 depth);
    event LicenseUpdated(bytes32 indexed assetId, License license);

    // =========================================================================
    // EVENTS — V1
    // =========================================================================

    event KBPublished(bytes32 indexed contentHash, address indexed curator, KBType indexed kbType, string domain, uint256 queryFee, uint256 timestamp);
    event KBStaked(bytes32 indexed contentHash, address indexed curator, uint256 amount);
    event KBUnstaked(bytes32 indexed contentHash, address indexed curator, uint256 amount);
    event KBSlashed(bytes32 indexed contentHash, address indexed curator, uint256 slashedAmount, string reason);
    event QuerySettled(bytes32 indexed contentHash, address indexed querier, uint256 totalFee, uint256 protocolFee);
    event RoyaltyPaid(bytes32 indexed contentHash, address indexed recipient, uint256 amount);
    event ReputationUpdated(bytes32 indexed contentHash, uint16 newScore, uint32 queryVolume);
    event KBEndorsed(bytes32 indexed contentHash, address indexed endorser);

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier assetExists(bytes32 assetId) {
        require(assets[assetId].timestamp != 0, "Asset does not exist");
        _;
    }

    modifier kbExists(bytes32 contentHash) {
        require(knowledgeBlocks[contentHash].exists, "KB not registered");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // =========================================================================
    // V1 — PUBLICATION
    // =========================================================================

    function publishKB(
        bytes32           contentHash,
        address           curator,
        KBType            kbType,
        TrustTier         trustTier,
        string  calldata  cid,
        string  calldata  embeddingCid,
        string  calldata  domain,
        string  calldata  licenseType,
        uint256           queryFee,
        string  calldata  version,
        AttributionLink[] calldata parents
    ) external payable nonReentrant {
        require(contentHash != bytes32(0),            "Invalid hash");
        require(curator != address(0),                "Invalid curator");
        require(!knowledgeBlocks[contentHash].exists, "Already published");
        require(msg.value >= minStakeAmount,          "Insufficient stake");
        require(bytes(cid).length > 0,                 "CID required");
        require(bytes(domain).length > 0,              "Domain required");

        _validateAttributionShares(contentHash, parents);

        knowledgeBlocks[contentHash] = KnowledgeBlock({
            curator:      curator,
            kbType:       kbType,
            trustTier:    trustTier,
            cid:          cid,
            embeddingCid: embeddingCid,
            domain:       domain,
            licenseType:  licenseType,
            queryFee:     queryFee,
            timestamp:    block.timestamp,
            version:      version,
            exists:       true
        });

        for (uint256 i = 0; i < parents.length; i++) {
            attributionDAG[contentHash].push(parents[i]);
            derivedBlocks[parents[i].parentHash].push(contentHash);
        }

        stakes[contentHash] = StakeRecord({
            amount:      msg.value,
            lockedUntil: block.timestamp + 30 days,
            slashed:     false
        });

        reputation[contentHash] = ReputationRecord({
            queryVolume:      0,
            positiveOutcomes: 0,
            endorsements:     0,
            score:            0,
            lastUpdated:      block.timestamp
        });

        curatorBlocks[curator].push(contentHash);
        blocksByType[uint8(kbType)].push(contentHash);
        blocksByDomain[keccak256(bytes(domain))].push(contentHash);

        emit KBPublished(contentHash, curator, kbType, domain, queryFee, block.timestamp);
        emit KBStaked(contentHash, curator, msg.value);
    }

    // =========================================================================
    // V1 — SETTLEMENT
    // =========================================================================

    /**
     * @notice Settle a query fee atomically through the attribution DAG.
     *
     *   1. Protocol fee → treasury
     *   2. Parent shares → upstream curators per royaltyShareBps
     *   3. Remainder → direct curator
     *
     * msg.value must equal kb.queryFee exactly.
     * Slashed KBs cannot be queried.
     */
    function settleQuery(
        bytes32 contentHash,
        address querier
    ) external payable nonReentrant kbExists(contentHash) {
        KnowledgeBlock storage kb = knowledgeBlocks[contentHash];
        require(msg.value == kb.queryFee,       "Incorrect fee");
        require(!stakes[contentHash].slashed,   "KB slashed");

        uint256 protocolFee   = (msg.value * protocolFeesBps) / 10000;
        treasuryBalance      += protocolFee;
        uint256 distributable = msg.value - protocolFee;

        AttributionLink[] storage links = attributionDAG[contentHash];
        uint256 parentTotal = 0;

        for (uint256 i = 0; i < links.length; i++) {
            if (!knowledgeBlocks[links[i].parentHash].exists) continue;
            uint256 share = (distributable * links[i].royaltyShareBps) / 10000;
            if (share == 0) continue;
            parentTotal += share;
            address parentCurator = knowledgeBlocks[links[i].parentHash].curator;
            (bool sent, ) = payable(parentCurator).call{value: share}("");
            require(sent, "Parent royalty failed");
            emit RoyaltyPaid(links[i].parentHash, parentCurator, share);
            reputation[links[i].parentHash].queryVolume += 1;
        }

        uint256 curatorAmount = distributable - parentTotal;
        if (curatorAmount > 0) {
            (bool sent, ) = payable(kb.curator).call{value: curatorAmount}("");
            require(sent, "Curator payment failed");
            emit RoyaltyPaid(contentHash, kb.curator, curatorAmount);
        }

        reputation[contentHash].queryVolume += 1;
        _recomputeScore(contentHash);

        emit QuerySettled(contentHash, querier, msg.value, protocolFee);
    }

    // =========================================================================
    // V1 — STAKING
    // =========================================================================

    function addStake(bytes32 contentHash) external payable kbExists(contentHash) {
        require(msg.value > 0, "Zero stake");
        require(knowledgeBlocks[contentHash].curator == msg.sender, "Only curator");
        stakes[contentHash].amount      += msg.value;
        stakes[contentHash].lockedUntil  = block.timestamp + 30 days;
        emit KBStaked(contentHash, msg.sender, msg.value);
    }

    function withdrawStake(bytes32 contentHash) external nonReentrant kbExists(contentHash) {
        require(knowledgeBlocks[contentHash].curator == msg.sender, "Only curator");
        StakeRecord storage s = stakes[contentHash];
        require(!s.slashed,                        "Stake slashed");
        require(block.timestamp >= s.lockedUntil,  "Still locked");
        require(s.amount > 0,                      "Nothing to withdraw");
        uint256 amount = s.amount;
        s.amount = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdrawal failed");
        emit KBUnstaked(contentHash, msg.sender, amount);
    }

    // =========================================================================
    // V1 — SLASHING
    // =========================================================================

    function slash(bytes32 contentHash, string calldata reason)
        external onlyOwner kbExists(contentHash)
    {
        StakeRecord storage s = stakes[contentHash];
        require(!s.slashed, "Already slashed");
        require(s.amount > 0, "No stake");
        uint256 slashAmount = (s.amount * slashRateBps) / 10000;
        s.amount  -= slashAmount;
        s.slashed  = true;
        treasuryBalance += slashAmount;
        emit KBSlashed(contentHash, knowledgeBlocks[contentHash].curator, slashAmount, reason);
    }

    // =========================================================================
    // V1 — REPUTATION
    // =========================================================================

    function recordPositiveOutcome(bytes32 contentHash) external onlyOwner kbExists(contentHash) {
        reputation[contentHash].positiveOutcomes += 1;
        _recomputeScore(contentHash);
    }

    function endorse(bytes32 contentHash) external kbExists(contentHash) {
        require(knowledgeBlocks[contentHash].curator != msg.sender, "No self-endorse");
        require(curatorBlocks[msg.sender].length > 0, "Must be registered curator");
        reputation[contentHash].endorsements += 1;
        _recomputeScore(contentHash);
        emit KBEndorsed(contentHash, msg.sender);
    }

    // =========================================================================
    // V1 — VIEWS
    // =========================================================================

    function isRegistered(bytes32 contentHash) external view returns (bool) {
        return knowledgeBlocks[contentHash].exists;
    }

    function getCurator(bytes32 contentHash) external view returns (address) {
        require(knowledgeBlocks[contentHash].exists, "Not registered");
        return knowledgeBlocks[contentHash].curator;
    }

    function getKnowledgeBlock(bytes32 contentHash)
        external view kbExists(contentHash) returns (KnowledgeBlock memory)
    { return knowledgeBlocks[contentHash]; }

    function getAttributionDAG(bytes32 contentHash)
        external view kbExists(contentHash) returns (AttributionLink[] memory)
    { return attributionDAG[contentHash]; }

    function getStake(bytes32 contentHash)
        external view kbExists(contentHash) returns (StakeRecord memory)
    { return stakes[contentHash]; }

    function getReputation(bytes32 contentHash)
        external view kbExists(contentHash) returns (ReputationRecord memory)
    { return reputation[contentHash]; }

    function getCuratorBlocks(address curator) external view returns (bytes32[] memory) {
        return curatorBlocks[curator];
    }

    function getBlocksByType(KBType kbType) external view returns (bytes32[] memory) {
        return blocksByType[uint8(kbType)];
    }

    function getBlocksByDomain(string calldata domain) external view returns (bytes32[] memory) {
        return blocksByDomain[keccak256(bytes(domain))];
    }

    function getDerivedBlocks(bytes32 parentHash) external view returns (bytes32[] memory) {
        return derivedBlocks[parentHash];
    }

    function isDerivedFrom(bytes32 childHash, bytes32 parentHash) external view returns (bool) {
        AttributionLink[] storage links = attributionDAG[childHash];
        for (uint256 i = 0; i < links.length; i++) {
            if (links[i].parentHash == parentHash) return true;
        }
        return false;
    }

    function getShareSplit(bytes32 contentHash)
        external view kbExists(contentHash)
        returns (uint256 curatorBps, uint256 parentBps)
    {
        AttributionLink[] storage links = attributionDAG[contentHash];
        uint256 total = 0;
        for (uint256 i = 0; i < links.length; i++) total += links[i].royaltyShareBps;
        uint256 afterProtocol = 10000 - protocolFeesBps;
        parentBps  = total;
        curatorBps = afterProtocol - total;
    }

    // =========================================================================
    // V1 — ADMIN
    // =========================================================================

    function setProtocolFee(uint256 bps) external onlyOwner { require(bps <= 1000, "Max 10%"); protocolFeesBps = bps; }
    function setSlashRate(uint256 bps)   external onlyOwner { require(bps <= 5000, "Max 50%"); slashRateBps = bps; }
    function setMinStake(uint256 amount) external onlyOwner { minStakeAmount = amount; }

    function withdrawTreasury(address payable to) external onlyOwner nonReentrant {
        uint256 amount = treasuryBalance;
        treasuryBalance = 0;
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Treasury withdrawal failed");
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    function _validateAttributionShares(
        bytes32 contentHash,
        AttributionLink[] calldata parents
    ) internal view {
        uint256 totalBps = 0;
        for (uint256 i = 0; i < parents.length; i++) {
            require(parents[i].parentHash != contentHash, "No self-reference");
            require(knowledgeBlocks[parents[i].parentHash].exists, "Parent not registered");
            totalBps += parents[i].royaltyShareBps;
        }
        require(totalBps <= 10000 - protocolFeesBps, "Shares exceed distributable");
    }

    /**
     * @dev Deterministic reputation formula. Anyone can verify off-chain.
     *
     *   queryWeight       = min(500, queryVolume * 2)
     *   outcomeWeight     = min(400, positiveOutcomes/queryVolume * 400)
     *   endorsementWeight = min(100, endorsements * 20)
     *   score             = min(1000, sum)
     */
    function _recomputeScore(bytes32 contentHash) internal {
        ReputationRecord storage r = reputation[contentHash];

        uint256 qw = r.queryVolume * 2;
        if (qw > 500) qw = 500;

        uint256 ow = 0;
        if (r.queryVolume > 0) {
            ow = (uint256(r.positiveOutcomes) * 400) / r.queryVolume;
            if (ow > 400) ow = 400;
        }

        uint256 ew = uint256(r.endorsements) * 20;
        if (ew > 100) ew = 100;

        uint256 score = qw + ow + ew;
        if (score > 1000) score = 1000;

        r.score       = uint16(score);
        r.lastUpdated = block.timestamp;

        emit ReputationUpdated(contentHash, uint16(score), r.queryVolume);
    }

    // =========================================================================
    // EXISTING FUNCTIONS (unchanged)
    // =========================================================================

    function registerAsset(bytes32 fingerprint, string memory cid, License memory license, bytes32[] memory parents)
        external returns (bytes32)
    {
        bytes32 assetId = keccak256(abi.encodePacked(fingerprint, msg.sender, block.timestamp));
        require(assets[assetId].timestamp == 0, "Asset already exists");
        for (uint i = 0; i < parents.length; i++) {
            require(assets[parents[i]].timestamp != 0, "Parent asset not found");
            provenanceGraph[assetId].push(Provenance({ assetId: assetId, parentId: parents[i], depth: i, timestamp: block.timestamp }));
            emit DerivationRegistered(assetId, parents[i], i);
        }
        assets[assetId] = Asset({ fingerprint: fingerprint, cid: cid, creator: msg.sender, timestamp: block.timestamp, blockNumber: block.number, license: license, parents: parents, active: true });
        creatorAssets[msg.sender].push(assetId);
        emit AssetRegistered(assetId, fingerprint, cid, msg.sender, block.timestamp);
        return assetId;
    }

    function getProvenance(bytes32 assetId) external view assetExists(assetId) returns (Provenance[] memory) { return provenanceGraph[assetId]; }
    function getAsset(bytes32 assetId) external view assetExists(assetId) returns (Asset memory) { return assets[assetId]; }
    function verifyAsset(bytes32 assetId, bytes32 claimedFingerprint) external view assetExists(assetId) returns (bool) { return assets[assetId].fingerprint == claimedFingerprint; }
    function updateLicense(bytes32 assetId, License memory newLicense) external assetExists(assetId) {
        require(assets[assetId].creator == msg.sender, "Only creator"); require(assets[assetId].active, "Inactive");
        assets[assetId].license = newLicense; emit LicenseUpdated(assetId, newLicense);
    }
    function deactivateAsset(bytes32 assetId) external assetExists(assetId) { require(assets[assetId].creator == msg.sender, "Only creator"); assets[assetId].active = false; }
    function getCreatorAssets(address creator) external view returns (bytes32[] memory) { return creatorAssets[creator]; }
    function isDerivedFromAsset(bytes32 childId, bytes32 parentId) external view returns (bool) {
        Provenance[] memory h = provenanceGraph[childId];
        for (uint i = 0; i < h.length; i++) if (h[i].parentId == parentId) return true;
        return false;
    }

    receive() external payable { treasuryBalance += msg.value; }
}
