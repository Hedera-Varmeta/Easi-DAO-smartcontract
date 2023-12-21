import * as hre from "hardhat";
import * as fs from "fs";
import { Signer } from "ethers";

const ethers = hre.ethers;
const upgrades = hre.upgrades;

async function main() {
    //Loading accounts
    const accounts: Signer[] = await ethers.getSigners();
    const admin = accounts[0];

    console.log("ACCOUNT: " + (await admin.getAddress()));
    const balance = (await admin.getBalance()).toString();
    console.log(
        `The address ${await admin.getAddress()} has ${balance} tinybars`,
    );

    //Loading contracts' factory
    const GovernorFactory = await ethers.getContractFactory("GovernorFactory");

    const StandardGovernorFactory = await ethers.getContractFactory(
        "StandardGovernor",
    );

    const ERC20VotesStandardFactory = await ethers.getContractFactory(
        "ERC20VotesStandard",
    );

    const ERC721VotesStandardFactory = await ethers.getContractFactory(
        "ERC721VotesStandard",
    );

    const TimelockControllerFactory = await ethers.getContractFactory(
        "TimelockController",
    );

    // Deploy contracts
    console.log(
        "==================================================================",
    );
    console.log("DEPLOY CONTRACTS");
    console.log(
        "==================================================================",
    );
    const governorFactory = GovernorFactory.attach(
        "0x0000000000000000000000000000000000cb7488",
    );

    console.log(await governorFactory.timelockController());

    // const standardGovernor = await StandardGovernorFactory.deploy();
    // await standardGovernor.deployed();
    // console.log("standardGovernor deployed at:", standardGovernor.address);

    // const ERC20VoteToken = await ERC20VotesStandardFactory.deploy();
    // await ERC20VoteToken.deployed();
    // console.log("ERC20VoteToken deployed at:", ERC20VoteToken.address);

    // const ERC721VoteToken = await ERC721VotesStandardFactory.deploy();
    // await ERC721VoteToken.deployed();
    // console.log("ERC721VoteToken deployed at:", ERC721VoteToken.address);

    // const timelock = await TimelockControllerFactory.deploy();
    // await timelock.deployed();
    // console.log("timelock deployed at:", timelock.address);

    // const governorFactory = await upgrades.deployProxy(
    //     GovernorFactory,
    //     [timelock.address],
    //     {
    //         kind: "uups",
    //     },
    // );

    // await governorFactory.deployed();
    // console.log("governorFactory deployed at:", governorFactory.address);
    // const governorIplmAddress = await upgrades.erc1967.getImplementationAddress(
    //     governorFactory.address,
    // );
    // console.log(
    //     "governorFactory implementation deployed at,",
    //     governorIplmAddress,
    // );

    // const governorIplm = GovernorFactory.attach(governorIplmAddress);

    // await governorIplm.addGovernorPreset(
    //     "StandardGovernor",
    //     standardGovernor.address,
    // );
    // console.log("StandardGovernor preset added");

    // let res = await governorIplm.getAllGovernorPresets();
    // console.log("Governor presets: ", res);

    // await governorIplm.addVoteTokenPreset(
    //     "ERC20VotesStandard",
    //     ERC20VoteToken.address,
    // );
    // console.log("ERC20VotesStandard preset added");

    // await governorIplm.addVoteTokenPreset(
    //     "ERC721VotesStandard",
    //     ERC721VoteToken.address,
    // );
    // console.log("ERC721VotesStandard preset added");

    // res = await governorIplm.getAllVoteTokenPresets();
    // console.log("Vote token presets: ", res);

    // const contractAddress = {
    //     governor: governorFactory.address,
    //     implementation: await upgrades.erc1967.getImplementationAddress(
    //         governorFactory.address,
    //     ),
    //     timelock: timelock.address,
    // };

    // fs.writeFileSync("contracts.json", JSON.stringify(contractAddress));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
