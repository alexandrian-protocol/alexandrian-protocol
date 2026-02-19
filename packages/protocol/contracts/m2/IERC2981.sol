// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/** M2 optional: ERC-2981 royalty compatibility (future KB tokenization). */
interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 amount);
}
