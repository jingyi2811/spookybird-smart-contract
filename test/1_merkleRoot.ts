import {MerkleTree} from "merkletreejs";
import keccak256 from "keccak256";
import {ethers} from "hardhat";
import {expect} from "chai";
import {SpookyBirdsCandy} from '../typechain-types'

describe("MerkleRoot", function () {
    let admin: any
    let account1: any
    let account2: any
    let SpookyBirdsCandyMock: any
    let account1Proof: any
    let account2Proof: any
    let tree: any;

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();

        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy")
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("https://ggwp.com");
    });

    it("Should be able to public mint", async function () {
        const leaves = [account1.address, account2.address].map(x => keccak256(x))
        tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        const leaf1 = keccak256(account1.address);
        account1Proof = tree.getHexProof(leaf1);

        const leaf2 = keccak256(account2.address);
        account2Proof = tree.getHexProof(leaf2);

        const scamLeaf = keccak256(admin.address);
        const scamProof = tree.getHexProof(scamLeaf);

        await SpookyBirdsCandyMock.setPhase(2, tree.getHexRoot());
        await SpookyBirdsCandyMock.publicMintAirDrop([account1.address, account2.address], [4, 4]);

        await SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)
        await SpookyBirdsCandyMock.connect(account2).publicMint(account2Proof)
    })

    it("Should not be able to public mint if invalid proof", async function () {
        const leaves = [account1.address, account2.address].map(x => keccak256(x))
        tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        const leaf1 = keccak256(account1.address);
        account1Proof = tree.getHexProof(leaf1);

        const leaf2 = keccak256(account2.address);
        account2Proof = tree.getHexProof(leaf2);

        const scamLeaf = keccak256(admin.address);
        const scamProof = tree.getHexProof(scamLeaf);

        await SpookyBirdsCandyMock.setPhase(2, tree.getHexRoot());
        await SpookyBirdsCandyMock.publicMintAirDrop([account1.address, account2.address], [4, 4]);

        await expect(
             SpookyBirdsCandyMock.connect(admin).publicMint(scamProof)
        ).to.be.revertedWithCustomError(SpookyBirdsCandyMock, 'NotAWhitelistedAddress')
    })

    it("Should not be able to public mint if valid proof but with different sender", async function () {
        const leaves = [account1.address, account2.address].map(x => keccak256(x))
        tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        const leaf1 = keccak256(account1.address);
        account1Proof = tree.getHexProof(leaf1);

        const leaf2 = keccak256(account2.address);
        account2Proof = tree.getHexProof(leaf2);

        const scamLeaf = keccak256(admin.address);
        const scamProof = tree.getHexProof(scamLeaf);

        await SpookyBirdsCandyMock.setPhase(2, tree.getHexRoot());
        await SpookyBirdsCandyMock.publicMintAirDrop([account1.address, account2.address], [4, 4]);

        await expect(
             SpookyBirdsCandyMock.connect(account2).publicMint(account1Proof)
        ).to.be.revertedWithCustomError(SpookyBirdsCandyMock, 'NotAWhitelistedAddress')
    })
});
