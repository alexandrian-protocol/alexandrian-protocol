// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILicense {
    struct License {
        address issuer;
        address licensee;
        bytes32 artifactId;
        string termsUri;
    }

    function issue(bytes32 licenseId, address licensee, bytes32 artifactId, string calldata termsUri) external;
    function getLicense(bytes32 licenseId) external view returns (License memory);
}
