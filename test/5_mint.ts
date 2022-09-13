import { ethers } from "hardhat";
import { expect } from "chai";
import { SpookyBirdsCandy, SpookyBirdsCandy__factory } from '../typechain-types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("Mint", function () {
    let admin: SignerWithAddress
    let account1: SignerWithAddress
    let account2: SignerWithAddress
    let SpookyBirdsCandyMock: SpookyBirdsCandy
    let account1Proof: string[]
    let account2Proof: string[]
    let tree: MerkleTree;


    beforeEach(async function () {
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

        // allocation for later test case to fill the total supply
        await SpookyBirdsCandyMock.publicMintAirDrop([account1.address, account2.address], [4_887, 4_887]);

        // claim from account1 and account2 to make the total supply balance = 2
        await SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)
        await SpookyBirdsCandyMock.connect(account2).publicMint(account2Proof)

    });

    describe("Mint", function () {
        it("Should mint and shouldn't mint after total supply limit reached.", async function () {

            // mint 1 to account 1
            expect(
                await SpookyBirdsCandyMock.mint(account1.address, 1)
            ).ok;

            // mint 1 to account 2
            expect(
                await SpookyBirdsCandyMock.mint(account2.address, 1)
            ).ok;

            // mint 1 to account 1 again should failed.
            await expect(
                SpookyBirdsCandyMock.mint(account1.address, 1)
            ).to.be.revertedWithCustomError(SpookyBirdsCandyMock, 'TotalSupplyHasReached')
        })

        it("Should not mint, if mint function is not call by contract owner.", async function () {

            await expect(
                SpookyBirdsCandyMock.connect(account1).mint(account1.address, 1)
            ).to.be.revertedWith('Ownable: caller is not the owner');

            await expect(
                SpookyBirdsCandyMock.connect(account2).mint(account1.address, 1)
            ).to.be.revertedWith('Ownable: caller is not the owner');
        })
    });
});
