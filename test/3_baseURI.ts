import {ethers} from "hardhat";
import {expect} from "chai";
import {SpookyBirdsCandy} from '../typechain-types'

describe("BaseURI", function () {
    let admin: any
    let account1: any
    let SpookyBirdsCandyFactory: any
    let SpookyBirdsCandyMock: any

    beforeEach(async function () {
        [admin, account1] = await ethers.getSigners();
        SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy", admin);
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://ggwp.com");
    });

    describe("BaseURI", function () {
        it("Should able to set different base uri if owner", async function () {
            await SpookyBirdsCandyMock.setBaseURI("http://ggwp.co")
        })

        it('Should able to set different base uri if not owner', async function () {
            await expect(
                SpookyBirdsCandyMock.connect(account1).setBaseURI("http://ggwp.co")
            ).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });
});