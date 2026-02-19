// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC1271.sol";

/**
 * M2: ERC-1271–aware verification. EOA = ecrecover; contract = IERC1271.isValidSignature.
 */
library SignatureHelper {
    bytes4 private constant ERC1271_MAGIC = 0x1626ba7e;

    function isValidSignatureNow(address signer, bytes32 hash, bytes memory signature) internal view returns (bool) {
        if (signer.code.length == 0) return _recoverEthSignedMessageHash(hash, signature) == signer;
        return IERC1271(signer).isValidSignature(hash, signature) == ERC1271_MAGIC;
    }

    function isValidSignatureNowPreHashed(address signer, bytes32 hash, bytes memory signature) internal view returns (bool) {
        if (signer.code.length == 0) return _recoverEcdsa(hash, signature) == signer;
        return IERC1271(signer).isValidSignature(hash, signature) == ERC1271_MAGIC;
    }

    function _recoverEthSignedMessageHash(bytes32 hash, bytes memory signature) private pure returns (address) {
        return _recoverEcdsa(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)), signature);
    }

    function _recoverEcdsa(bytes32 hash, bytes memory signature) private pure returns (address) {
        require(signature.length == 65, "SignatureHelper: invalid length");
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "SignatureHelper: invalid v");
        address recovered = ecrecover(hash, v, r, s);
        require(recovered != address(0), "SignatureHelper: invalid signature");
        return recovered;
    }
}
