import * as hre from "hardhat";
import fs from "fs";
import { ethers } from "hardhat";
import {
    hethers,
    ContractFactory,
    Wallet,
    Transaction,
    getDefaultProvider,
} from "@hashgraph/hethers";
import { GovernorFactory__factory } from "../typechain-types";
import {
    AccountId,
    AccountInfoQuery,
    Client,
    ContractCallQuery,
    ContractCreateFlow,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractFunctionResult,
    ContractId,
    DelegateContractId,
    EvmAddress,
    Hbar,
    PrivateKey,
    TokenId,
    TransactionReceipt,
    TransactionRecord,
    TransactionRecordQuery,
    
} from "@hashgraph/sdk";
import * as standardGovernorTemplate from "../artifacts/contracts/GovernorTemplates/StandardGovernor.sol/StandardGovernor.json";
import * as timelockTemplate from "../artifacts/contracts/TimeLocks/TimelockController.sol/TimelockController.json";
import * as erc20VotesTemplate from "../artifacts/contracts/VoteTokens/ERC20Votes.sol/ERC20VotesStandard.json";
import * as ERC1155InstanceStandardFactory from "../artifacts/contracts/VoteTokens/ERC1155Instance.sol/ERC1155Instance.json";
import * as erc721VotesTemplate from "../artifacts/contracts/VoteTokens/ERC721Votes.sol/ERC721VotesStandard.json";
import * as governorFactoryTemplate from "../artifacts/contracts/GovernorFactory.sol/GovernorFactory.json";
import * as dotenv from "dotenv";
import axios from "axios";
import { AbiCoder } from "ethers/lib/utils";
import BigNumber from "bignumber.js";
dotenv.config();

enum voteOptions {
    AGAINST = 0,
    FOR = 1,
    ABSTAIN = 2,
}
async function main() {

    //Loading accounts 1
    const operatorId = AccountId.fromString(`${process.env.HEDERA_ACCOUNT_ID}`);
    const operatorKey = PrivateKey.fromString(
        `${process.env.HEDERA_PRIVATE_KEY}`,
    );
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
    const info1 = await new AccountInfoQuery()
        .setAccountId(operatorId)
        .execute(client);

    console.log(`The normal account ID: ${info1.accountId}`);
    console.log(`Account Balance: ${info1.balance}`);

    //Loading accounts 2
    const operatorId2 = AccountId.fromString("0.0.4053091");
    const operatorKey2 = PrivateKey.fromString(
        "3030020100300706052b8104000a04220420168cc3d264a5296b6203d821288f4df722d2d2a3ef1f3b31b1d80a24cf0b63c4",
    );
    const client2 = Client.forTestnet();
    client2.setOperator(operatorId2, operatorKey2);
    const info2 = await new AccountInfoQuery()
        .setAccountId(operatorId2)
        .execute(client2);

    console.log(`The normal account ID: ${info2.accountId}`);
    console.log(`Account Balance: ${info2.balance}`);

    // import contract
    console.log(`${process.env.CONTRACT_ID}`)
    const contractId = ContractId.fromString(`${process.env.CONTRACT_ID}`);

    // set salt
    const salt = ethers.utils.arrayify(
        ethers.utils.formatBytes32String(Date.now().toString()),
    );

    // predict address
    const timelockAddressResponse = await submitQueryTx(
        client,
        contractId,
        "predictTimelockDeterministicAddress",
        new ContractFunctionParameters().addBytes32(salt),
    );
    const timelockAddress = timelockAddressResponse.getAddress(0);
    console.log("Timelock address: ", timelockAddress);

    const treasuryAddressResponse = await submitQueryTx(
        client,
        contractId,
        "predictTreasuryDeterministicAddress",
        new ContractFunctionParameters().addBytes32(salt),
    );
    const treasury = treasuryAddressResponse.getAddress(0);
    console.log("Treasury address: ", treasury);

    const voteTokenAddressResponse = await submitQueryTx(
        client,
        contractId,
        "predictVoteTokenDeterministicAddress",
        new ContractFunctionParameters()
            // .addString("ERC20VotesStandard")
            .addString("ERC721VotesStandard")
            .addBytes32(salt),
    );
    const voteTokenAddress = voteTokenAddressResponse.getAddress(1);
    console.log("Vote token address: ", voteTokenAddress);

    const governorAddressResponse = await submitQueryTx(
        client,
        contractId,
        "predictGovernorDeterministicAddress",
        new ContractFunctionParameters()
            .addString("StandardGovernor")
            .addBytes32(salt),
    );
    const governorPredictAddress = governorAddressResponse.getAddress(1);
    console.log("Governor address: ", governorPredictAddress);

    // set up create governor
    const ERC20Template = await ethers.getContractFactory(
        // "ERC20VotesStandard",
        "ERC721VotesStandard",
    );
    const ERC1155Template = await ethers.getContractFactory(
        // "ERC20VotesStandard",
        "ERC1155Instance",
    );
    const treasuryTemplate = await ethers.getContractFactory(
        "Treasury",
    );
    const StandardGovernorFactory = await ethers.getContractFactory(
        "StandardGovernor",
    );

    const governorInitializeData =
        StandardGovernorFactory.interface.encodeFunctionData("initialize", [
            "0x" + voteTokenAddress,
            "0x" + timelockAddress,
            0,
            0,
            20,
            0,
            "MyGovernor",
        ]);

    const ERC20VotesStandardFactory = await ethers.getContractFactory(
        "ERC20VotesStandard",
    );
    const ERC721VotesStandardFactory = await ethers.getContractFactory(
        "ERC721VotesStandard",
    );
    const erc1155Address = "0x0000000000000000000000000000000000e4cb18"

    const ERC20VoteTokenInitializeData =
        ERC20VotesStandardFactory.interface.encodeFunctionData("initialize", [
            "SimpleERC20VoteToken",
            "SVT",
            "0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7"
        ]);

    const ERC721VoteTokenInitializeData =
        ERC721VotesStandardFactory.interface.encodeFunctionData("initialize", [
            "SimpleERC20VoteToken",
            "SVT",
            "",
            "0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7"
        ]);

    // get token templates
    // const tokenTemplates = await getTokenTemplate(client, contractId)
    // // create governor using token
    // const { receipt: createGovernorReceipt } = await submitExectTx(
    //     client,
    //     contractId,
    //     "createGovernor",
    //     new ContractFunctionParameters()
    //         .addString("StandardGovernor")
    //         .addBytes(ethers.utils.arrayify(governorInitializeData))
    //         .addString("ERC20VotesStandard")
    //         .addBytes(ethers.utils.arrayify(ERC20VoteTokenInitializeData))
    //         .addUint256(0)
    //         .addAddressArray(["0x" + governorPredictAddress])
    //         .addAddressArray(["0x" + governorPredictAddress])
    //         .addAddress("0x" + governorPredictAddress)
    //         .addBytes32(salt),
    // );
    // create governor using NFT
    // const { receipt: createGovernorReceipt } = await submitExectTx(
    //     client,
    //     contractId,
    //     "createGovernor",
    //     new ContractFunctionParameters()
    //         .addString("StandardGovernor")
    //         .addBytes(ethers.utils.arrayify(governorInitializeData))
    //         .addString("ERC721VotesStandard")
    //         .addBytes(ethers.utils.arrayify(ERC721VoteTokenInitializeData))
    //         .addUint256(0)
    //         .addAddressArray(["0x" + governorPredictAddress])
    //         .addAddressArray(["0x" + governorPredictAddress])
    //         .addAddress("0x" + governorPredictAddress)
    //         .addBytes32(salt),
    // );

    //get governor, token, timelock addresses
    const { governorAddress,
        voteTokenAddress_1,
        timelockAddress_1, treasury_1 } = await getGovernor(0, client, contractId)
    console.log(await getBalance1155(
        erc1155Address,
        client,
        "0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7",
        4
    ))
    // mint token for user;
    // await mintTokenERC721(
    //     voteTokenAddress_1,
    //     "1",
    //     client,
    //     "0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7",
    // );

    // await mintTokenERC721(
    //     voteTokenAddress_1,
    //     "12",
    //     client,
    //     "0x912dd6679e275bbcb93075f76600aa08d79ae43f",
    // );

    // const toContractRx = await contractExecuteNoFcn(contractId, 10, client);
    // const { record: mintRecord, } = await submitExectTx(
    //     client,
    //     await getContractIdPreview(voteTokenAddress_1),
    //     "transfer",
    //     new ContractFunctionParameters()
    //         .addAddress(treasury_1)
    //         .addUint256(2)
    // );

    const balance1 = await getBalance(
        voteTokenAddress_1,
        client,
        "0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7",

    )

    const balance2 = await getBalance(
        voteTokenAddress_1,
        client,
        "0x912dd6679e275bbcb93075f76600aa08d79ae43f"
    )

    console.log("balance1:" + balance1 + ",balance2:" + balance2);
    // const block = await getCurrentBlockNumber();
    // console.log(await getCurrentBlockNumber())
    // console.log(await getVoteWeight("0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7", client, block[0].number, governorAddress))
    // console.log(await getVoteWeight("0x912dd6679e275bbcb93075f76600aa08d79ae43f", client,  block[0].number, governorAddress))

    //mint for timelock
    // await mintTokenERC1155(
    //     erc1155Address,
    //     3,
    //     12,
    //     client,
    //     treasury_1,
    //     "treasury_1"
    // );

    // const balance3 = await getBalance1155(
    //     erc1155Address,
    //     client,
    //     treasury_1,
    //     3
    // )

    // console.log("balance treasury:" + balance3);

    // give ownership to timelock
    // await submitExectTx(
    //     client,
    //     await getContractIdPreview(voteTokenAddress_1),
    //     "transferOwnership",
    //     new ContractFunctionParameters().addAddress(timelockAddress_1)
    // )

    //propose the proposal action mint
    const encodedFunction1 =
        ERC20Template.interface.encodeFunctionData("mint", [
            treasury_1, 5
        ]);
    const encodedFunction1155 =
        ERC1155Template.interface.encodeFunctionData("mint", [
            treasury_1, 4, 3, ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("s")))
        ]);


    //propose the proposal action transfer
    // const encodedFunction2 =
    //     treasuryTemplate.interface.encodeFunctionData("releaseERC20", [
    //         "0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7", 40, voteTokenAddress_1
    //     ]);
    const encodedFunction2 =
        treasuryTemplate.interface.encodeFunctionData("releaseNativeToken", [
            "0x912dd6679e275bbcb93075f76600aa08d79ae43f", 10
        ]);

    //change to uint8array
    const myUint8Array1 = ethers.utils.arrayify(encodedFunction1155);
    const myUint8Array2 = ethers.utils.arrayify(encodedFunction2);

    const description = "lo7nels7w5y"
    const { record: governorRecord } = await submitExectTx(
        client,
        await getContractIdPreview(governorAddress),
        "propose",
        new ContractFunctionParameters()
            // .addAddressArray([voteTokenAddress_1])
            // .addUint256Array([0])
            // .addBytesArray([myUint8Array1])
            // .addString(description),
            .addAddressArray([treasury_1])
            .addUint256Array([0])
            .addBytesArray([myUint8Array2])
            .addString(description),
    );

    const governorId = governorRecord?.contractFunctionResult?.getBytes32(0);

    //get state
    let proposalState = await getProposalState(governorId!, governorAddress, client);

    //get snapshot, deadline and quorum
    const snapshot = await getSnapshot(governorAddress, client, governorId!);
    const deadline = await getDeadline(governorAddress, client, governorId!);
    let latestBlock = await getCurrentBlockNumber();
    latestBlock = latestBlock[0].number;
    console.log(`Current blocknumber: ${latestBlock}\n`)
    let quorumTemp = await getQuorum(governorAddress, client, latestBlock);

    // delegate token
    console.log(`Casting votes...\n`);
    await delegateToken(voteTokenAddress_1, client, "0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7");
    await delegateToken(voteTokenAddress_1, client2, "0x912dd6679e275bbcb93075f76600aa08d79ae43f");

    // 0 = Against, 2 = For, 0 = Abstain

    let { receipt: vote1Recepit, record: vote1Record } = await vote(governorAddress, client, governorId!, voteOptions.FOR);
    let { receipt: vote2Recepit, record: vote2Record } = await vote(governorAddress, client2, governorId!, voteOptions.FOR);
    console.log("vote weight client 2:", vote2Record?.contractFunctionResult?.getUint256(0))
    console.log("vote weight client 1:", vote1Record?.contractFunctionResult?.getUint256(0))

    // //has voted 
    // const voted = await submitQueryTx(
    //     client,
    //     await getContractIdPreview(voteTokenAddress_1),
    //     "getVotes",
    //     new ContractFunctionParameters().addAddress("0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7"),
    // )

    //wait until deadline
    latestBlock = await getCurrentBlockNumber();
    latestBlock = latestBlock[0].number;
    while (latestBlock <= deadline.toNumber()) {
        latestBlock = await getCurrentBlockNumber();
        latestBlock = latestBlock[0].number;
    }

    proposalState = await getProposalState(governorId!, governorAddress, client);

    //get result of proposal
    await getVoteResult(governorAddress, client, governorId!);

    proposalState = await getProposalState(governorId!, governorAddress, client);

    const queueTransaction = await submitExectTx(
        client,
        await getContractIdPreview(governorAddress),
        "queue",
        new ContractFunctionParameters()
            // .addAddressArray([voteTokenAddress_1])
            //     .addUint256Array([0])
            //     .addBytesArray([myUint8Array1])
            .addAddressArray([treasury_1])
            .addUint256Array([0])
            .addBytesArray([myUint8Array2])
            .addBytes32(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description)))),
    )

    while (latestBlock <= deadline.toNumber() + 1) {
        latestBlock = await getCurrentBlockNumber();
        latestBlock = latestBlock[0].number;
    }
    console.log(`Current blocknumber: ${latestBlock}\n`)

    const executeTransaction = await submitExectTx(
        client,
        await getContractIdPreview(governorAddress),
        "execute",
        new ContractFunctionParameters()
            // .addAddressArray([voteTokenAddress_1])
            //     .addUint256Array([0])
            //     .addBytesArray([myUint8Array1])
            .addAddressArray([treasury_1])
            .addUint256Array([0])
            .addBytesArray([myUint8Array2])
            .addBytes32(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description)))),
    )

    proposalState = proposalState = await getProposalState(governorId!, governorAddress, client);
    const balance1Temp = await getBalance1155(
        erc1155Address,
        client,
        "0x3fef58b6f03ceaf46e8ee75499abef55b1289bc7",
        1
    )

    const balance2Temp = await getBalance1155(
        erc1155Address,
        client,
        "0x912dd6679e275bbcb93075f76600aa08d79ae43f",
        2
    )

    const balance3Temp = await getBalance1155(
        erc1155Address,
        client,
        treasury_1,
        3
    )
    const balance31Temp = await getBalance1155(
        erc1155Address,
        client,
        treasury_1,
        4
    )

    console.log("balance1:" + balance1Temp + ",balance2:" + balance2Temp, "," + balance3Temp + "," + balance31Temp);
}

const getContractIdPreview = async (address: string) => {
    if (address[0] !== "0" && address[1] !== "x") address = "0x" + address;
    const contractId = await axios({
        method: "get",
        url:
            "https://testnet.mirrornode.hedera.com/api/v1/contracts/" + address,
    })
        .then((response) => {
            return response.data.contract_id;
        })
        .catch((error) => {
            return error;
        });
    return contractId;
};

const getCurrentBlockNumber = async () => {
    const latestBlock = await axios.get(
        `https://testnet.mirrornode.hedera.com/api/v1/blocks?order=DESC&limit=1`,
        {
            headers: {
                "Content-Type": "application/json",
            }
        }
    )
        .then((response) => {
            return response.data.blocks;
        })
        .catch((error) => {
            return error;
        });
    return latestBlock;
};


const mintTokenERC721 = async (voteTokenAddress: string, tokenURI: string, client: Client, address: string) => {
    const owner = await submitQueryTx(
        client,
        await getContractIdPreview(voteTokenAddress),
        "owner",
    );
    if (!client || !client._operator || !client._operator.accountId) {
        console.log("client not connected");
        return;
    }
    const clientEVMAddress = await getEVMAddress(client._operator?.accountId.toString());
    if (clientEVMAddress !== ("0x" + owner.getAddress(0))) {
        console.log("client not owner");
        return;
    }

    const { record: mintRecord, } = await submitExectTx(
        client,
        await getContractIdPreview(voteTokenAddress),
        "safeMint",
        new ContractFunctionParameters()
            .addAddress(address)
            .addString(tokenURI)
    );
}

const mintTokenERC1155 = async (
    tokenAddress: string,
    tokenId: any,
    amount: any,
    client: Client,
    address: string,
    data: string
) => {

    if (!client || !client._operator || !client._operator.accountId) {
        console.log("client not connected");
        return;
    }
    const clientEVMAddress = await getEVMAddress(client._operator?.accountId.toString());
    // if (clientEVMAddress !== ("0x" + owner.getAddress(0))) {
    //     console.log("client not owner");
    //     return;
    // }

    const { record: mintRecord, } = await submitExectTx(
        client,
        await getContractIdPreview(tokenAddress),
        "mint",
        new ContractFunctionParameters()
            .addAddress(address)
            .addUint256(tokenId)
            .addUint256(amount)
            .addBytes(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data))))
    );
}
const getBalance = async (voteTokenAddress: string, client: Client, address: string) => {
    const record1 = await submitQueryTx(
        client,
        await getContractIdPreview(voteTokenAddress),
        "balanceOf",
        new ContractFunctionParameters().addAddress(address),
    )
    return record1.getUint256(0);
}

const getBalance1155 = async (voteTokenAddress: string, client: Client, address: string, id: number) => {
    const record1 = await submitQueryTx(
        client,
        await getContractIdPreview(voteTokenAddress),
        "balanceOf",
        new ContractFunctionParameters().addAddress(address).addUint256(id),
    )
    return record1.getUint256(0);
}

const getVoteResult = async (governorAddress: string, client: Client, governorId: Uint8Array) => {
    const Votes = await submitQueryTx(
        client,
        await getContractIdPreview(governorAddress),
        "proposalVotes",
        new ContractFunctionParameters().addBytes32(governorId!),
    )

    console.log(`Votes Against: ${Votes.getUint256(0).toString()}`)
    console.log(`Votes forVotes: ${Votes.getUint256(1).toString()}`)
    console.log(`Votes abstainVotes: ${Votes.getUint256(2).toString()}\n`)
}

const delegateToken = async (voteTokenAddress: string, client: Client, address: string) => {
    await submitExectTx(
        client,
        await getContractIdPreview(voteTokenAddress),
        "delegate",
        new ContractFunctionParameters().addAddress(
            address
        )
    )
}

const vote = async (governorAddress: string, client: Client, governorId: Uint8Array, support: number) => {
    let { receipt: voteRecepit, record: voteRecord } = await submitExectTx(
        client,
        await getContractIdPreview(governorAddress),
        "castVote",
        new ContractFunctionParameters().addBytes32(governorId!).addUint8(support)
    )
    return { receipt: voteRecepit, record: voteRecord }
}

const getVoteWeight = async (account: string, client: Client, blockNumber: number, governorAddress: string) => {
    let getVoteWeight = await submitQueryTx(
        client,
        await getContractIdPreview(governorAddress),
        "getVotes",
        new ContractFunctionParameters().addAddress(account).addUint256(blockNumber)
    )
    return getVoteWeight.getUint256(0);
}

const getSnapshot = async (governorAddress: string, client: Client, governorId: Uint8Array) => {
    const snapshot = await submitQueryTx(
        client,
        await getContractIdPreview(governorAddress),
        "proposalSnapshot",
        new ContractFunctionParameters().addBytes32(governorId),
    )
    console.log(`Proposal created on block ${snapshot.getUint256(0)}`);
    return snapshot.getUint256(0);
}

const getDeadline = async (governorAddress: string, client: Client, governorId: Uint8Array) => {
    const deadline = await submitQueryTx(
        client,
        await getContractIdPreview(governorAddress),
        "proposalDeadline",
        new ContractFunctionParameters().addBytes32(governorId!),
    )
    console.log(`Proposal deadline on block ${deadline.getUint256(0)}`)
    return deadline.getUint256(0);
}

const getQuorum = async (governorAddress: string, client: Client, latestBlock: number) => {
    let quorumTemp = await submitQueryTx(
        client,
        await getContractIdPreview(governorAddress),
        "quorum",
        new ContractFunctionParameters().addUint256(latestBlock - 1),
    );
    console.log(`Number of votes required to pass: ${quorumTemp.getUint256(0).toFixed()}\n`)
    return quorumTemp.getUint256(0).toFixed();
}

const getEVMAddress = async (accountId: string) => {
    const AccountInfo = await axios({
        method: "get",
        url:
            "https://testnet.mirrornode.hedera.com/api/v1/accounts?account.id=" + accountId,
    })
        .then((response) => {
            return response.data.accounts[0].evm_address;
        })
        .catch((error) => {
            return error;
        });
    return AccountInfo;
};

async function contractExecuteNoFcn(cId : ContractId, amountHbar: number | BigNumber, client: Client) {
    const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(cId)
        .setGas(100000)
        .setPayableAmount(Hbar.fromTinybars(amountHbar));
    const contractExecuteSubmit = await contractExecuteTx.execute(client);
    const contractExecuteRx = await contractExecuteSubmit.getReceipt(client);
    return contractExecuteRx;
}

const getGovernor = async (index: number, client: Client, contractId: ContractId) => {
    const governorResponse = await submitQueryTx(
        client,
        contractId,
        "governors",
        new ContractFunctionParameters().addUint256(index),
    );

    const governorAddress = "0x" + governorResponse.getAddress(0);
    console.log("Governor address: ", governorAddress);

    const voteTokenAddress_1 = "0x" + governorResponse.getAddress(1);
    console.log("VoteToken address: ", voteTokenAddress_1);

    const timelockAddress_1 = "0x" + governorResponse.getAddress(2);
    console.log("Timelock address: ", timelockAddress_1);

    const treasury_1 = "0x" + governorResponse.getAddress(3);
    console.log("Treasury address: ", treasury_1);

    return {
        governorAddress,
        voteTokenAddress_1,
        timelockAddress_1,
        treasury_1
    }
}

const getTokenTemplate = async (client: Client, contractId: ContractId) => {
    const getAllVoteTokenPresets = await submitQueryTx(
        client,
        contractId,
        "getAllVoteTokenPresets",
    );
    const abiCoder = new AbiCoder();

    const tokenTemplates = abiCoder.decode(["string[]"], getAllVoteTokenPresets.bytes);

    return tokenTemplates;
}

const getProposalState = async (governorId: Uint8Array, governorAddress: string, client: Client) => {

    let proposalState = await submitQueryTx(
        client,
        await getContractIdPreview(governorAddress),
        "state",
        new ContractFunctionParameters().addBytes32(governorId),
    );

    console.log(`Current state of proposal: ${proposalState.getUint8(0)}\n`);

    return proposalState.getUint8(0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const submitExectTx = async (
    client: Client,
    contractId: ContractId,
    functionName: string,
    params: ContractFunctionParameters,
): Promise<{ receipt: TransactionReceipt; record?: TransactionRecord }> => {
    const contractExecTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(2000000)
        .setFunction(functionName, params);
    //Submit the transaction to a Hedera network and store the response
    const submitExecTx = await contractExecTx.execute(client);
    //Get the receipt of the transaction
    const receipt2 = await submitExecTx.getReceipt(client);
    //get the record of the transaction
    const record2 = await submitExecTx.getRecord(client);
    //Confirm the transaction was executed successfully
    console.log("The transaction status is " + receipt2.status.toString());
    return { receipt: receipt2, record: record2 };
};

const submitQueryTx = async (
    client: Client,
    contractId: ContractId,
    functionName: string,
    params?: ContractFunctionParameters,
): Promise<ContractFunctionResult> => {
    const contractQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(1000000)
        .setFunction(functionName, params)
        .setQueryPayment(new Hbar(3));
    //Submit the transaction to a Hedera network and store the response
    const getMessage = await contractQuery.execute(client);
    return getMessage;
};

const useHethers = async () => {
    const defaultProvider = hethers.providers.getDefaultProvider("testnet");
    const wallet = new Wallet(
        `${process.env.HEDERA_ECDSA_HEX_PRIVATE_KEY}`,
        defaultProvider,
    );

    const connectedWallet = wallet.connectAccount(
        `${process.env.HEDERA_ACCOUNT_ID}`,
    );

    // console.log("🚀 ~ file: connect_hashgraph.ts:29 ~ main ~ wallet:", wallet);

    console.log(connectedWallet.address);
    console.log(await connectedWallet.getBalance());
    const governorFactory = new hethers.ContractFactory(
        governorFactoryTemplate.abi,
        governorFactoryTemplate.bytecode,
        connectedWallet,
    );
    const governorFactoryContract = governorFactory.attach(
        "0000000000000000000000000000000000cc4e8f",
    );

    governorFactoryContract.connect(connectedWallet);

    await governorFactoryContract.addGovernorPreset(
        "test",
        "0x0000000000000000000000000000000000cc4e8f",
        {
            gasLimit: 3000000,
        },
    );

    console.log(
        await governorFactoryContract.getAllGovernorPresets({
            gasLimit: 3000000,
        }),
    );
};
