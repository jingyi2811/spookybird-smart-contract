import {ethers} from "hardhat";
import {Signer} from "ethers";
import {expect} from "chai";

export const randomSigners = async (admin: any, amount: number): Promise<any[]> => {
    const signers: Signer[] = []
    for (let i = 0; i < amount; i++) {
        let wallet = ethers.Wallet.createRandom();
        wallet = wallet.connect(ethers.provider);
        await admin.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});
        signers.push(wallet)
    }
    return signers
}

describe("Calculate gas", function () {
    let admin: any
    let account1: any

    let SpookyBirdsCandyFactory: any
    let SpookyBirdsCandyMock: any
    let account1Proof: any
    let account2Proof: any

    let addressArr: any
    let ZombieBirdFactoryMock: any

    beforeEach(async function () {
        [admin, account1] = await ethers.getSigners();

        addressArr = await randomSigners(admin, 150);
        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://bird/");

        const ZombieBirdFactory = await ethers.getContractFactory("ZombieBird");
        ZombieBirdFactoryMock = await ZombieBirdFactory.deploy();
    });

    describe("Airdrop",  function () {
        it("Should airdrop", async function () {
            await SpookyBirdsCandyMock.connect(admin).setPhase(2, ethers.utils.formatBytes32String(""));

            await SpookyBirdsCandyMock.connect(admin).publicSaleAirDrop([
               addressArr[0].address,
               addressArr[1].address,
               addressArr[2].address,
               addressArr[3].address,
               addressArr[4].address,
               addressArr[5].address,
               addressArr[6].address,
               addressArr[7].address,
               addressArr[8].address,
               addressArr[9].address,
               addressArr[10].address,
               addressArr[11].address,
               addressArr[12].address,
               addressArr[13].address,
               addressArr[14].address,
               addressArr[15].address,
               addressArr[16].address,
               addressArr[17].address,
               addressArr[18].address,
               addressArr[19].address,
               addressArr[20].address,
               addressArr[21].address,
               addressArr[22].address,
               addressArr[23].address,
               addressArr[24].address,
               addressArr[25].address,
               addressArr[26].address,
               addressArr[27].address,
               addressArr[28].address,
               addressArr[29].address,
               addressArr[30].address,
               addressArr[31].address,
               addressArr[32].address,
               addressArr[33].address,
               addressArr[34].address,
               addressArr[35].address,
               addressArr[36].address,
               addressArr[37].address,
               addressArr[38].address,
               addressArr[39].address,
               addressArr[40].address,
               addressArr[41].address,
               addressArr[42].address,
               addressArr[43].address,
               addressArr[44].address,
               addressArr[45].address,
               addressArr[46].address,
               addressArr[47].address,
               addressArr[48].address,
               addressArr[49].address,
               addressArr[50].address,
               addressArr[51].address,
               addressArr[52].address,
               addressArr[53].address,
               addressArr[54].address,
               addressArr[55].address,
               addressArr[56].address,
               addressArr[57].address,
               addressArr[58].address,
               addressArr[59].address,
               addressArr[60].address,
               addressArr[61].address,
               addressArr[62].address,
               addressArr[63].address,
               addressArr[64].address,
               addressArr[65].address,
               addressArr[66].address,
               addressArr[67].address,
               addressArr[68].address,
               addressArr[69].address,
               addressArr[70].address,
               addressArr[71].address,
               addressArr[72].address,
               addressArr[73].address,
               addressArr[74].address,
               addressArr[75].address,
               addressArr[76].address,
               addressArr[77].address,
               addressArr[78].address,
               addressArr[79].address,
               addressArr[80].address,
               addressArr[81].address,
               addressArr[82].address,
               addressArr[83].address,
               addressArr[84].address,
               addressArr[85].address,
               addressArr[86].address,
               addressArr[87].address,
               addressArr[88].address,
               addressArr[89].address,
               addressArr[90].address,
               addressArr[91].address,
               addressArr[92].address,
               addressArr[93].address,
               addressArr[94].address,
               addressArr[95].address,
               addressArr[96].address,
               addressArr[97].address,
               addressArr[98].address,
               addressArr[99].address,
               addressArr[100].address,
               addressArr[101].address,
               addressArr[102].address,
               addressArr[103].address,
               addressArr[104].address,
               addressArr[105].address,
               addressArr[106].address,
               addressArr[107].address,
               addressArr[108].address,
               addressArr[109].address,
               addressArr[110].address,
               addressArr[111].address,
               addressArr[112].address,
               addressArr[113].address,
               addressArr[114].address,
               addressArr[115].address,
               addressArr[116].address,
               addressArr[117].address,
               addressArr[118].address,
               addressArr[119].address,
               addressArr[120].address,
               addressArr[121].address,
               addressArr[122].address,
               addressArr[123].address,
               addressArr[124].address,
               addressArr[125].address,
               addressArr[126].address,
               addressArr[127].address,
           ], [
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1,
               1
           ])
        })
    });

    describe("Burn candy",  function () {
        it("Should burn", async function () {
            await SpookyBirdsCandyMock.connect(admin).setPhase(3, ethers.utils.formatBytes32String(""));

            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Should get 0 zombie bird, timestamp and times
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(0)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(0)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimes(account1.address)).to.be.equal(0)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0, 1, 2, 3])

            const timestamp = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Should get 1 zombie bird
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(timestamp)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimes(account1.address)).to.be.equal(1)

            // Set external address
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            const now = timestamp + 2 + 2_592_000
            await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
            await ethers.provider.send('evm_mine', []);

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()
        })
    })
});