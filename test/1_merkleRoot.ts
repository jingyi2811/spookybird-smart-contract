import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { ethers } from "hardhat";
import { expect } from "chai";
import { SpookyBirdsCandy, SpookyBirdsCandy__factory } from '../typechain-types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'


describe("MerkleRoot", function () {
    let admin: SignerWithAddress
    let account1: SignerWithAddress
    let account2: SignerWithAddress
    let SpookyBirdsCandyMock: SpookyBirdsCandy
    let account1Proof: string[]
    let account2Proof: string[]
    let tree: MerkleTree;


    before(async function () {
        [admin, account1, account2] = await ethers.getSigners();

        const leaves = [account1.address, account2.address].map(x => keccak256(x))
        tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        // get account1 & account2 merkle proof
        const leaf1 = keccak256(account1.address);
        account1Proof = tree.getHexProof(leaf1);

        const leaf2 = keccak256(account2.address);
        account2Proof = tree.getHexProof(leaf2);
        // const buf2hex = (x: Buffer) => '0x' + x.toString('hex')
        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy", admin) as SpookyBirdsCandy__factory;
        //console.log(buf2hex(tree.getRoot()))
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("https://ggwp.com");

        // set phase
        await SpookyBirdsCandyMock.setPhase(2, tree.getHexRoot());

        // allocation for later test case to claim
        await SpookyBirdsCandyMock.publicSaleAirDrop([account1.address, account2.address], [4, 4]);
    });

    it("Should be valid proof", async function () {

        expect(
            await SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)
        ).ok

        // check error if claim again
        await expect(
             SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)
        ).to.be.revertedWithCustomError(SpookyBirdsCandyMock, 'CannotClaimMoreThan1Time')

        expect(
            await SpookyBirdsCandyMock.connect(account2).publicMint(account2Proof)
        ).ok
    })

    it("Invalid proof", async function () {
        const scamLeaf = keccak256(admin.address);
        const scamProof = tree.getHexProof(scamLeaf);

        await expect(
             SpookyBirdsCandyMock.connect(admin).publicMint(scamProof)
        ).to.be.revertedWithCustomError(SpookyBirdsCandyMock, 'NotAWhitelistedAddress')
    })

    it("Use valid proof, but different msg.Sender", async function () {
        await expect(
             SpookyBirdsCandyMock.connect(admin).publicMint(account1Proof)
        ).to.be.revertedWithCustomError(SpookyBirdsCandyMock, 'NotAWhitelistedAddress')
    })
});
