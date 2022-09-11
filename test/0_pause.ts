import {expect} from "chai";
import {ethers} from "hardhat";

describe("Pause", function () {
    let admin: any
    let account1: any
    let account2: any
    let SpookyBirdsCandyMock: any

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();
        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://");
    });

    describe("Without pressing pause or unpause",  function () {
        it("Should be able to mint, transfer and burn with setApprovalForAll", async function () {
            // mint
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 1);

            // transfer
            await SpookyBirdsCandyMock.connect(account1).transferFrom(account1.address, account2.address, 0);
        })

        it("Should be able to mint, transfer and burn with approve ", async function () {
            // mint
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 1);
            // transfer
            await SpookyBirdsCandyMock.connect(account1).transferFrom(account1.address, account2.address, 0);
        })
    });

    describe("Pause",  function () {
        it("Should not be able to mint, transfer and burn", async function () {
            // pause
            await SpookyBirdsCandyMock.connect(admin).pause();

            // mint
            await expect(SpookyBirdsCandyMock.connect(admin).mint(account1.address, 1))
                .to.be.revertedWith('Pausable: paused');

            // unpause
            await SpookyBirdsCandyMock.connect(admin).unpause();

            // mint
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 1);

            // pause
            await SpookyBirdsCandyMock.connect(admin).pause();

            // transfer
            await expect(SpookyBirdsCandyMock.connect(account1).transferFrom(account1.address, account2.address, 0))
                .to.be.revertedWith('Pausable: paused');
        })

        it("Non admin should not able to pause", async function () {
            await expect(SpookyBirdsCandyMock.connect(account1).pause())
                .to.be.revertedWith('Ownable: caller is not the owner');
        })
    });

    describe("Unpause",  function () {
        it("Should not be able to mint, transfer and burn", async function () {
            // Try unpause
            await expect(SpookyBirdsCandyMock.connect(admin).unpause())
                .to.be.revertedWith('Pausable: not paused');

            // Pause
            await SpookyBirdsCandyMock.connect(admin).pause();

            // Unpause
            await SpookyBirdsCandyMock.connect(admin).unpause();

            // mint
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 1);

            // transfer
            await SpookyBirdsCandyMock.connect(account1).transferFrom(account1.address, account2.address, 0);
        })

        it("Non admin should not able to unpause", async function () {
            await expect(SpookyBirdsCandyMock.connect(account1).unpause())
                .to.be.revertedWith('Ownable: caller is not the owner');
        })
    });
});
