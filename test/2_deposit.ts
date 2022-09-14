import {ethers} from "hardhat";
import {expect} from "chai";

describe("Deposit", function () {
    let admin: any
    let SpookyBirdsCandyFactory: any
    let SpookyBirdsCandyMock: any

    beforeEach(async function () {
        [admin] = await ethers.getSigners();
        SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://");
    });

    describe("Should reject deposit",  function () {
        it("Should not deposit by invoking the payable function which is not exists", async () => {
            await expect(
                admin.sendTransaction({
                    to: SpookyBirdsCandyMock.address,
                    value: ethers.utils.parseEther("1.0")
                })
            ).to.be.reverted;
        })

        it('should not deposit by invoking the fallback function which is not exists', async () => {
            const tx = admin.sendTransaction({
                to: SpookyBirdsCandyMock.address,
                data: "0x",
            });

            await expect(tx).to.be.reverted;
        });
    });
});