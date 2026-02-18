// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/ILicense.sol";

contract License is ILicense {
    mapping(bytes32 => License) private licenses;

    event LicenseIssued(bytes32 indexed licenseId, address indexed issuer, address indexed licensee);

    function issue(bytes32 licenseId, address licensee, bytes32 artifactId, string calldata termsUri)
        external
        override
    {
        require(licenses[licenseId].issuer == address(0), "Exists");
        licenses[licenseId] = License(msg.sender, licensee, artifactId, termsUri);
        emit LicenseIssued(licenseId, msg.sender, licensee);
    }

    function getLicense(bytes32 licenseId) external view override returns (License memory) {
        return licenses[licenseId];
    }
}
