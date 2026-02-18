// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RoyaltyDAG {
    struct Asset {
        address creator;
        uint256 baseRoyalty; // Creator's cut (basis points, 0-10000)
        uint256 parentCount;
        mapping(uint256 => Derivative) parents;
    }

    struct Derivative {
        bytes32 parentId;
        uint256 share; // Share of parent's royalty (basis points)
    }

    mapping(bytes32 => Asset) public assets;
    mapping(address => uint256) public balances;

    event AssetRegistered(bytes32 indexed id, address creator);
    event RoyaltyDistributed(bytes32 indexed assetId, uint256 amount);

    /**
     * Register a new asset with its parents
     */
    function registerAsset(
        bytes32 assetId,
        address creator,
        uint256 baseRoyalty,
        bytes32[] memory parentIds,
        uint256[] memory parentShares
    ) external {
        require(assets[assetId].creator == address(0), "Asset exists");
        require(parentIds.length == parentShares.length, "Length mismatch");

        Asset storage asset = assets[assetId];
        asset.creator = creator;
        asset.baseRoyalty = baseRoyalty;

        for (uint i = 0; i < parentIds.length; i++) {
            require(assets[parentIds[i]].creator != address(0), "Parent missing");
            asset.parents[i] = Derivative(parentIds[i], parentShares[i]);
        }
        asset.parentCount = parentIds.length;

        emit AssetRegistered(assetId, creator);
    }

    /**
     * Distribute payment up the DAG (recursive)
     */
    function distributePayment(bytes32 assetId) external payable {
        _distribute(assetId, msg.value);
    }

    function _distribute(bytes32 assetId, uint256 amount) internal {
        Asset storage asset = assets[assetId];

        // Creator gets their base cut
        uint256 creatorShare = (amount * asset.baseRoyalty) / 10000;
        if (creatorShare > 0) {
            balances[asset.creator] += creatorShare;
        }

        // Distribute remaining to parents
        uint256 remaining = amount - creatorShare;
        if (remaining > 0 && asset.parentCount > 0) {
            uint256 totalShare = 0;
            for (uint i = 0; i < asset.parentCount; i++) {
                totalShare += asset.parents[i].share;
            }

            for (uint i = 0; i < asset.parentCount; i++) {
                Derivative memory parent = asset.parents[i];
                uint256 parentShare = (remaining * parent.share) / totalShare;
                _distribute(parent.parentId, parentShare);
            }
        }

        emit RoyaltyDistributed(assetId, amount);
    }

    /**
     * Withdraw accumulated royalties
     */
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
