import {ethers} from "hardhat";
import {expect} from "chai";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";

describe("Public sale", function () {
    let admin: any
    let account1: any
    let account2: any
    let SpookyBirdsCandyFactory: any
    let SpookyBirdsCandyMock: any
    let account1Proof: any
    let account2Proof: any

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();

        const addresses = [admin.address, account1.address, account2.address];
        const leaves = addresses.map(x => keccak256(x))
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
        const buf2hex = (x: Buffer) => `0x${x.toString('hex')}`

        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://bird/");

        await SpookyBirdsCandyMock.connect(admin).setPhase(1, buf2hex(tree.getRoot()));

        {
            const leaf: any = keccak256(account1.address) // Get proof from account1
            account1Proof = tree.getProof(leaf).map(x => buf2hex(x.data))
        }

        {
            const leaf: any = keccak256(account2.address) // Get proof from account1
            account2Proof = tree.getProof(leaf).map(x => buf2hex(x.data))
        }

        await SpookyBirdsCandyMock.connect(admin).setPhase(2, buf2hex(tree.getRoot()));
    });

    describe("Airdrop",  function () {
        it("Should not airdrop when address and qty length are different", async function () {
            await expect(SpookyBirdsCandyMock.connect(admin).publicSaleAirDrop([account1.address], [])).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "AddressesAndQtysLengthAreDifferent"
            );
        })

        it("Should airdrop", async function () {
            await expect(SpookyBirdsCandyMock.connect(admin).publicSaleAirDrop([account1.address], [1]))
            expect(await SpookyBirdsCandyMock._publicSaleAirDropAddressQty(account1.address)).to.be.equal(1)
        })
    });

    describe("Public mint",  function () {
        it("Should not allow public mint if there is no airdrop", async function () {
            await expect(SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoPublicSaleAirdrop"
            );
        })

        it("Should not allow public mint if user has public mint before", async function () {
            // Airdrop
            await expect(SpookyBirdsCandyMock.connect(admin).publicSaleAirDrop([account1.address], [1]))
            expect(await SpookyBirdsCandyMock._publicSaleAirDropAddressQty(account1.address)).to.be.equal(1)

            // Claim
            await SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)
            await expect(SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "CannotClaimMoreThan1Time"
            );
        })

        it("Should not allow public mint if user is not a whitelisted address", async function () {
            // Airdrop
            await expect(SpookyBirdsCandyMock.connect(admin).publicSaleAirDrop([account1.address], [1]))
            expect(await SpookyBirdsCandyMock._publicSaleAirDropAddressQty(account1.address)).to.be.equal(1)

            // Claim
            await expect(SpookyBirdsCandyMock.connect(account1).publicMint(account2Proof)).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NotAWhitelistedAddress"
            );
        })

        it("Should allow public mint", async function () {
            // Airdrop
            await expect(SpookyBirdsCandyMock.connect(admin).publicSaleAirDrop([account1.address], [2]))
            expect(await SpookyBirdsCandyMock._publicSaleAirDropAddressQty(account1.address)).to.be.equal(2)

            // Claim
            await SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)

            expect(await SpookyBirdsCandyMock._hasPublicSaleAddressClaimed(account1.address)).to.be.true
            expect(await SpookyBirdsCandyMock.totalSupply()).to.be.equal(2)
            expect(await SpookyBirdsCandyMock.balanceOf(account1.address)).to.be.equal(2)
        })
    });
});