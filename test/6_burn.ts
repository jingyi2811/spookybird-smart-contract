import { ethers } from "hardhat";
import { expect } from "chai";
import { SpookyBirdsCandy, SpookyBirdsCandy__factory } from '../typechain-types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("Burn", function () {
    let admin: SignerWithAddress
    let account1: SignerWithAddress
    let account2: SignerWithAddress
    let account3: SignerWithAddress
    let SpookyBirdsCandyMock: SpookyBirdsCandy
    let account1Proof: string[]
    let account2Proof: string[]
    let tree: MerkleTree;


    beforeEach(async function () {
        [admin, account1, account2, account3] = await ethers.getSigners();

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
        await SpookyBirdsCandyMock.publicSaleAirDrop([account1.address, account2.address], [4_887, 4_887]);

        // claim from account1 and account2 to make the total supply balance = 2
        await SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)
        await SpookyBirdsCandyMock.connect(account2).publicMint(account2Proof)

    });

    describe("Burn", function () {
        it("Should burn", async function () {
            await SpookyBirdsCandyMock.connect(admin).burn(123);
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_773)

            await SpookyBirdsCandyMock.connect(admin).burn(1235)
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_772)
        })

        it('Should not burn if not contract owner', async () => {

            await expect(SpookyBirdsCandyMock.connect(account1).burn(1235)).revertedWith('Ownable: caller is not the owner');
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_774);

            await expect(SpookyBirdsCandyMock.connect(account2).burn(1235)).revertedWith('Ownable: caller is not the owner');
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_774);

            await expect(SpookyBirdsCandyMock.connect(account3).burn(1236)).revertedWith('Ownable: caller is not the owner');
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_774);
        });
    });
});
