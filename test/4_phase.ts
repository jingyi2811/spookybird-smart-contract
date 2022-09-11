import { ethers } from "hardhat";
import { expect } from "chai";
import { SpookyBirdsCandy, SpookyBirdsCandy__factory } from '../typechain-types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("Phase", function () {
    let admin: SignerWithAddress;
    let account1: SignerWithAddress;
    let account2: SignerWithAddress;
    let SpookyBirdsCandyFactory: SpookyBirdsCandy__factory;;
    let SpookyBirdsCandyMock: SpookyBirdsCandy;
    let account1Proof: string[];
    let account2Proof: string[];
    let tree: MerkleTree;
    let currentMerkleProof: string;

    beforeEach(async function () {

        [admin, account1, account2] = await ethers.getSigners();

        const leaves = [account1.address, account2.address].map(x => keccak256(x))
        tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        currentMerkleProof = tree.getHexRoot();

        // get account1 & account2 merkle proof
        const leaf1 = keccak256(account1.address);
        account1Proof = tree.getHexProof(leaf1);

        const leaf2 = keccak256(account2.address);
        account2Proof = tree.getHexProof(leaf2);

        SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy", admin) as SpookyBirdsCandy__factory;

        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("https://ggwp.com");
    });

    describe("SET PHASE", function () {
        it("Should able to set phase", async function () {

            expect(
                await SpookyBirdsCandyMock.setPhase(0, currentMerkleProof)
            ).ok;

            expect(
                await SpookyBirdsCandyMock.setPhase(1, currentMerkleProof)
            ).ok;

            expect(
                await SpookyBirdsCandyMock.setPhase(2, currentMerkleProof)
            ).ok;

            expect(
                await SpookyBirdsCandyMock.setPhase(3, currentMerkleProof)
            ).ok;

            await expect(
                SpookyBirdsCandyMock.setPhase(4, currentMerkleProof)
            ).to.be.reverted
        })

        it('Should not set the phase - NOT OWNER', async function () {
            await expect(
                SpookyBirdsCandyMock.connect(account2).setPhase(1, currentMerkleProof)
            ).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('Set phase with multiple different merkle proof', async function () {

            const leaves1 = [account1.address].map(x => keccak256(x))
            const tree1 = new MerkleTree(leaves1, keccak256, { sortPairs: true })

            const leaves2 = [account2.address].map(x => keccak256(x))
            const tree2 = new MerkleTree(leaves2, keccak256, { sortPairs: true })

            expect(
                await SpookyBirdsCandyMock.setPhase(2, tree1.getHexRoot())
            ).ok

            expect(
                await SpookyBirdsCandyMock.setPhase(2, tree2.getHexRoot())
            ).ok
        });
    });
});
