// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/** M2: EIP-712 domain + type hashes for query/deprecation typed signatures. */
contract AlexandrianEIP712 {
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    string public constant EIP712_DOMAIN_NAME = "Alexandrian Protocol";
    string public constant EIP712_DOMAIN_VERSION = "1";
    bytes32 public constant QUERY_COMMITMENT_TYPEHASH = keccak256(
        "QueryCommitment(bytes32 kbId,address agent,uint256 fee,uint256 deadline)"
    );
    bytes32 public constant DEPRECATION_REPORT_TYPEHASH = keccak256(
        "DeprecationReport(bytes32 kbId,bytes32 successor,address curator,uint256 deadline)"
    );

    function domainSeparatorV4() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(EIP712_DOMAIN_NAME)),
                keccak256(bytes(EIP712_DOMAIN_VERSION)),
                block.chainid,
                address(this)
            )
        );
    }
}
