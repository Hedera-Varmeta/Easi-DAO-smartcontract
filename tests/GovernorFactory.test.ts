import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { GovernorFactory, TimelockController, Treasury, Treasury__factory } from "../typechain-types";
import {
    StandardGovernor,
    ERC20VotesStandard,
    ERC721VotesStandard,
    Treasury
} from "../typechain-types";

import {
    TimelockController__factory,
    StandardGovernor__factory,
    ERC20VotesStandard__factory,
    ERC721VotesStandard__factory,
} from "../typechain-types";
import { BaseContract,  BigNumber, BigNumberish} from "ethers";
import { Interface } from "ethers/lib/utils";
import { Governor } from "../typechain-types/contracts/GovernorTemplates/StandardGovernor.sol";
import { timeLocks } from "../typechain-types/contracts";
describe("Greater", () => {
    let admin: SignerWithAddress;
    let proposer: SignerWithAddress;
    let executer: SignerWithAddress;

    let TimelockControllerFactory: TimelockController__factory;
    let StandardGovernorFactory: StandardGovernor__factory;
    let ERC20VotesStandardFactory: ERC20VotesStandard__factory;
    let ERC721VotesStandardFactory: ERC721VotesStandard__factory;
    let TreasuryStandardFactory: Treasury__factory;

    let governorFactory: GovernorFactory;
    let timelock: TimelockController;
    let standardGovernor: StandardGovernor;
    let ERC20VoteToken: ERC20VotesStandard;
    let ERC721VoteToken: ERC721VotesStandard;
    let treasury: Treasury;

    beforeEach(async () => {
        const accounts: SignerWithAddress[] = await ethers.getSigners();
        admin = accounts[0];
        proposer = accounts[1];
        executer = accounts[2];

        const GovernorFactory = await ethers.getContractFactory(
            "GovernorFactory",
        );
        governorFactory = await GovernorFactory.deploy();

        TimelockControllerFactory = await ethers.getContractFactory(
            "TimelockController",
        );
        timelock = await TimelockControllerFactory.deploy();

        TreasuryStandardFactory = await ethers.getContractFactory(
            "Treasury",
        );
        treasury = await TreasuryStandardFactory.deploy();

        StandardGovernorFactory = await ethers.getContractFactory(
            "StandardGovernor",
        );
        standardGovernor = await StandardGovernorFactory.deploy();

        ERC20VotesStandardFactory = await ethers.getContractFactory(
            "ERC20VotesStandard",
        );
        ERC20VoteToken = await ERC20VotesStandardFactory.deploy();

        ERC721VotesStandardFactory = await ethers.getContractFactory(
            "ERC721VotesStandard",
        );
        ERC721VoteToken = await ERC721VotesStandardFactory.deploy();

        await governorFactory.initialize(timelock.address, treasury.address);
    });

    describe("Deployment", () => {
        it("Should deploy successfully", async () => {
            expect(await governorFactory.owner()).to.equal(admin.address);

            expect(await governorFactory.timelockController()).to.equal(
                timelock.address,
            );
        });
    });

    describe("Set governor preset address", () => {
        it("Should set failed", async () => {
            await expect(
                governorFactory.addGovernorPreset(
                    "This is a very long preset name that exceed 32 bytes",
                    standardGovernor.address,
                ),
            ).to.revertedWith("GovernorFactory: invalid name");
        });

        it("Should set governor preset successfully", async () => {
            await governorFactory.addGovernorPreset(
                "SimpleGovernor",
                standardGovernor.address,
            );

            const allPreset = await governorFactory.getAllGovernorPresets();
            expect(allPreset.length).to.equal(1);
            expect(allPreset[0]).to.equal("SimpleGovernor");

            const governor = await governorFactory.getGovernorPresetAddress(
                "SimpleGovernor",
            );

            expect(governor[0]).to.equal(true);

            expect(governor[1]).to.equal(standardGovernor.address);
        });

        it("Should set vote token preset successfully", async () => {
            await governorFactory.addVoteTokenPreset(
                "SimpleERC20VoteToken",
                ERC20VoteToken.address,
            );

            const allPreset = await governorFactory.getAllVoteTokenPresets();
            expect(allPreset.length).to.equal(1);
            expect(allPreset[0]).to.equal("SimpleERC20VoteToken");

            const voteToken = await governorFactory.getVoteTokenPresetAddress(
                "SimpleERC20VoteToken",
            );

            expect(voteToken[0]).to.equal(true);

            expect(voteToken[1]).to.equal(ERC20VoteToken.address);
        });

        it("Should set vote token preset successfully", async () => {
            await governorFactory.addVoteTokenPreset(
                "SimpleERC721VoteToken",
                ERC721VoteToken.address,
            );

            const allPreset = await governorFactory.getAllVoteTokenPresets();
            expect(allPreset.length).to.equal(1);
            expect(allPreset[0]).to.equal("SimpleERC721VoteToken");

            const voteToken = await governorFactory.getVoteTokenPresetAddress(
                "SimpleERC721VoteToken",
            );

            expect(voteToken[0]).to.equal(true);

            expect(voteToken[1]).to.equal(ERC721VoteToken.address);
        });
    });

    describe("Create governor", () => {
        beforeEach(async () => {
            await governorFactory.addGovernorPreset(
                "SimpleGovernor",
                standardGovernor.address,
            );

            await governorFactory.addVoteTokenPreset(
                "SimpleERC20VoteToken",
                ERC20VoteToken.address,
            );

            await governorFactory.addVoteTokenPreset(
                "SimpleERC721VoteToken",
                ERC721VoteToken.address,
            );
        });

        const salt = ethers.utils.formatBytes32String("This is a salt");

        // it("Create standard gorvernor with standard erc20 vote token", async () => {
        //     const ERC20VoteTokenDeterministic =
        //         await governorFactory.predictVoteTokenDeterministicAddress(
        //             "SimpleERC20VoteToken",
        //             salt,
        //         );
        //     expect(ERC20VoteTokenDeterministic[0]).to.be.true;
        //     const timelockDeterministic =
        //         await governorFactory.predictTimelockDeterministicAddress(salt);
        //     const governorInitializeData =
        //         standardGovernor.interface.encodeFunctionData("initialize", [
        //             ERC20VoteTokenDeterministic[1],
        //             timelockDeterministic,
        //             10,
        //             10,
        //             10,
        //             10,
        //             "MyGovernor",
        //         ]);

        //     const ERC20VoteTokenInitializeData =
        //         ERC20VoteToken.interface.encodeFunctionData("initialize", [
        //             "SimpleERC20VoteToken",
        //             "SVT",
        //             admin.address,
        //         ]);

        //     await governorFactory.createGovernor(
        //         "SimpleGovernor",
        //         governorInitializeData,
        //         "SimpleERC20VoteToken",
        //         ERC20VoteTokenInitializeData,
        //         1000,
        //         [proposer.address],
        //         [executer.address],
        //         admin.address,
        //         salt,
        //     );

        //     const governor = await governorFactory.governors(0);

        //     expect(governor.timelock).to.equal(timelockDeterministic);
        //     expect(governor.voteToken).to.equal(ERC20VoteTokenDeterministic[1]);

        //     const timelockClone = TimelockControllerFactory.attach(
        //         governor.timelock,
        //     );
        //     expect(await timelockClone.getMinDelay()).to.equal(1000);

        //     const governorClone = StandardGovernorFactory.attach(
        //         governor.governor,
        //     );
        //     expect(await governorClone.name()).to.equal("MyGovernor");

        //     const ERC20VoteTokenClone = ERC20VotesStandardFactory.attach(
        //         governor.voteToken,
        //     );
        //     expect(await ERC20VoteTokenClone.name()).to.equal(
        //         "SimpleERC20VoteToken",
        //     );
        // });

        it("Create standard gorvernor with standard erc721 vote token", async () => {
            const ERC721VoteTokenDeterministic =
                await governorFactory.predictVoteTokenDeterministicAddress(
                    "SimpleERC721VoteToken",
                    salt,
                );

            expect(ERC721VoteTokenDeterministic[0]).to.be.true;
            const timelockDeterministic =
                await governorFactory.predictTimelockDeterministicAddress(salt);
            const governorInitializeData =
                standardGovernor.interface.encodeFunctionData("initialize", [
                    ERC721VoteTokenDeterministic[1],
                    timelockDeterministic,
                    10,
                    10,
                    10,
                    10,
                    "MyGovernor",
                ]);

            const ERC721VoteTokenInitializeData =
                ERC721VoteToken.interface.encodeFunctionData("initialize", [
                    "SimpleERC721VoteToken",
                    "SVT",
                    "",
                    admin.address,
                ]);

            await governorFactory.createGovernor(
                "SimpleGovernor",
                governorInitializeData,
                "SimpleERC721VoteToken",
                ERC721VoteTokenInitializeData,
                1000,
                [proposer.address],
                [executer.address],
                admin.address,
                salt,
            );

            const governor = await governorFactory.governors(0);
            expect(governor.timelock).to.equal(timelockDeterministic);
            expect(governor.voteToken).to.equal(
                ERC721VoteTokenDeterministic[1],
            );

            const timelockClone = TimelockControllerFactory.attach(
                governor.timelock,
            );
            expect(await timelockClone.getMinDelay()).to.equal(1000);

            const governorClone = StandardGovernorFactory.attach(
                governor.governor,
            );
            expect(await governorClone.name()).to.equal("MyGovernor");

            const ERC721VoteTokenClone = ERC721VotesStandardFactory.attach(
                governor.voteToken,
            );
            expect(await ERC721VoteTokenClone.name()).to.equal(
                "SimpleERC721VoteToken",
            );

            (await ERC721VoteTokenClone.safeMint(treasury.address, ""));
            console.log(await ERC721VoteTokenClone.balanceOf(treasury.address));
        });
    });

    // describe("Create proposal", () => {
    //     let governor: StandardGovernor;
    //     let voteToken: ERC20VotesStandard;
    //     let timelock: TimelockController;

    //     beforeEach(async () => {
    //         const salt = ethers.utils.formatBytes32String("This is a salt");
    //         await governorFactory.addGovernorPreset("SimpleGovernor", standardGovernor.address);
    //         await governorFactory.addVoteTokenPreset("SimpleERC20VoteToken", ERC20VoteToken.address);
    //         await governorFactory.addVoteTokenPreset("SimpleERC20VoteToken", ERC20VoteToken.address);
    //         ({ governor, voteToken, timelock } = await createGovernor(
    //             governorFactory,
    //             ERC20VoteToken.interface,
    //             standardGovernor.interface,
    //             proposer.address,
    //             executer.address,
    //             admin.address,
    //             salt,
    //         ));

    //     });
    //     it("Create standard gorvernor with standard erc721 vote token", async () => {
    //         // console.log(governor, voteToken, timelock);
    //         const encodedFunction = StandardGovernorFactory.interface.encodeFunctionData("releaseFunds", ["0x2472590da27c8791566fdac4c6c14b8b59fd7d72"]);

    //         const myUint8Array = ethers.utils.arrayify(encodedFunction);
    //         const propose = await governor.propose(
    //             ["0x0000000000000000000000000000000000000000"],
    //             [0],
    //             [myUint8Array],
    //             "nothing to say"
    //         )
    //         const receipt = await propose.wait();
    //         const events = receipt.events;
    //         let proposalId;
    //         if (events && events.length > 0) {
    //             proposalId = events[0].args?.proposalId;
    //             console.log(`Created Proposal: ${proposalId.toString()}\n ${proposalId}`);
    //           } else {
    //             console.log("Transaction did not emit any events.");
    //           }
    //         const test = BigNumber.from(proposalId);
    //         const states = await governor.state(test);
    //         console.log(states.toString());
    //     });
    // });


});

const createGovernor = async (
    governorFactory: GovernorFactory,
    voteTokenContract: Interface,
    governorContract: Interface,
    proposer: string,
    executer: string,
    admin: string,
    salt: string,
): Promise<{
    governor: StandardGovernor;
    voteToken: ERC20VotesStandard;
    timelock: TimelockController;
}> => {
    const ERC20VoteTokenDeterministic =
        await governorFactory.predictVoteTokenDeterministicAddress(
            "SimpleERC20VoteToken",
            salt,
        );
    const timelockDeterministic =
        await governorFactory.predictTimelockDeterministicAddress(salt);

    const governorInitializeData = governorContract.encodeFunctionData(
        "initialize",
        [
            ERC20VoteTokenDeterministic[1],
            timelockDeterministic,
            10,
            10,
            10,
            0,
            "MyGovernor",
        ],
    );

    const ERC20VoteTokenInitializeData = voteTokenContract.encodeFunctionData(
        "initialize",
        ["MyVoteToken", "MVT"],
    );

    const totalGovernors = await governorFactory.totalGovernor();

    await governorFactory.createGovernor(
        "SimpleGovernor",
        governorInitializeData,
        "SimpleERC20VoteToken",
        ERC20VoteTokenInitializeData,
        1000,
        [proposer],
        [executer],
        admin,
        salt,
    );

    const DAO = await governorFactory.governors(totalGovernors);
    const TimelockControllerFactory = await ethers.getContractFactory(
        "TimelockController",
    );

    const StandardGovernorFactory = await ethers.getContractFactory(
        "StandardGovernor",
    );

    const ERC20VotesStandardFactory = await ethers.getContractFactory(
        "ERC20VotesStandard",
    );


    return {
        governor: StandardGovernorFactory.attach(DAO.governor),
        voteToken: ERC20VotesStandardFactory.attach(DAO.voteToken),
        timelock: TimelockControllerFactory.attach(DAO.timelock),
    };
};
