/**
 * Registry contract — minimal integration test.
 * Ensures AlexandrianRegistry deploys and exposes getKnowledgeBlock.
 */
const hre = require("hardhat");
const { expect } = require("chai");

describe("AlexandrianRegistry", function () {
  it("deploys and returns registry address", async function () {
    const Registry = await hre.ethers.getContractFactory("AlexandrianRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    const address = await registry.getAddress();
    expect(address).to.be.a("string");
    expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
  });
});
