import * as hre from "hardhat";
import fs from "fs";

import {
    AccountId,
    AccountInfoQuery,
    Client,
    ContractCallQuery,
    ContractCreateFlow,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    PrivateKey,
} from "@hashgraph/sdk";
import * as standardGovernorTemplate from "../artifacts/contracts/GovernorTemplates/StandardGovernor.sol/StandardGovernor.json";
import * as timelockTemplate from "../artifacts/contracts/TimeLocks/TimelockController.sol/TimelockController.json";
import * as TreasuryTemplate from "../artifacts/contracts/Treasury/Treasury.sol/Treasury.json"
import * as erc20VotesTemplate from "../artifacts/contracts/VoteTokens/ERC20Votes.sol/ERC20VotesStandard.json";
import * as erc721VotesTemplate from "../artifacts/contracts/VoteTokens/ERC721Votes.sol/ERC721VotesStandard.json";
import * as erc1155Template from "../artifacts/contracts/VoteTokens/ERC1155Instance.sol/ERC1155Instance.json";
import * as governorFactoryTemplate from "../artifacts/contracts/GovernorFactory.sol/GovernorFactory.json";
import * as dotenv from "dotenv";
dotenv.config();
async function main() {
    //Loading accounts
    const operatorId = AccountId.fromString(`${process.env.HEDERA_ACCOUNT_ID}`);
    const operatorKey = PrivateKey.fromString(
        `${process.env.HEDERA_PRIVATE_KEY}`,
    );

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    const info = await new AccountInfoQuery()
        .setAccountId(operatorId)
        .execute(client);

    console.log(`The normal account ID: ${info.accountId}`);
    console.log(`Account Balance: ${info.balance}`);

    // Import the compiled contract from the HelloHedera.json file
    let bytecode = governorFactoryTemplate.bytecode;
    const { contractId: governorId, evmAddress: governorFactoryAddress } =
        await deployContractNoConstructor(client, bytecode, "GovernorFactory");

    bytecode = timelockTemplate.bytecode;
    const { contractId: timelockId, evmAddress: timelockAddress } =
        await deployContractNoConstructor(
            client,
            bytecode,
            "TimelockController",
        );
    bytecode = TreasuryTemplate.bytecode;
    const { contractId: treasuryId, evmAddress: treasuryAddress } =
        await deployContractNoConstructor(
            client,
            bytecode,
            "Treasury",
        );
    // Calling contract function
    let contractExecTx = new ContractExecuteTransaction()
        .setContractId(governorId)
        .setGas(1000000)
        .setFunction(
            "initialize",
            new ContractFunctionParameters().addAddress("0x" + timelockAddress).addAddress("0x" + treasuryAddress),
        );
    await submitExecTx(client, contractExecTx);

    // Deploying ERC20Votes
    bytecode = erc20VotesTemplate.bytecode;
    const { contractId: erc20VotesId, evmAddress: erc20VotesAddress } =
        await deployContractNoConstructor(
            client,
            bytecode,
            "ERC20VotesStandard",
        );

    bytecode = erc1155Template.bytecode;
    const { contractId: erc1155, evmAddress: erc1155Address } =
        await deployContractNoConstructor(
            client,
            bytecode,
            "erc1155",
        );

    // Calling contract function
    contractExecTx = new ContractExecuteTransaction()
        .setContractId(governorId)
        .setGas(1000000)
        .setFunction(
            "addVoteTokenPreset",
            new ContractFunctionParameters()
                .addString("ERC20VotesStandard")
                .addAddress(erc20VotesAddress),
        );
    await submitExecTx(client, contractExecTx);

    // Deploying ERC721Votes
    bytecode = erc721VotesTemplate.bytecode;
    const { contractId: erc721VotesId, evmAddress: erc721VotesAddress } =
        await deployContractNoConstructor(
            client,
            bytecode,
            "ERC721VotesStandard",
        );

    // Calling contract function
    contractExecTx = new ContractExecuteTransaction()
        .setContractId(governorId)
        .setGas(1000000)
        .setFunction(
            "addVoteTokenPreset",
            new ContractFunctionParameters()
                .addString("ERC721VotesStandard")
                .addAddress(erc721VotesAddress),
        );
    await submitExecTx(client, contractExecTx);

    // Deploying StandardGovernor
    bytecode = standardGovernorTemplate.bytecode;
    const {
        contractId: standardGovernorId,
        evmAddress: standardGovernorAddress,
    } = await deployContractNoConstructor(client, bytecode, "StandardGovernor");

    // Calling contract function
    contractExecTx = new ContractExecuteTransaction()
        .setContractId(governorId)
        .setGas(1000000)
        .setFunction(
            "addGovernorPreset",
            new ContractFunctionParameters()
                .addString("StandardGovernor")
                .addAddress(standardGovernorAddress),
        );
    await submitExecTx(client, contractExecTx);

    fs.writeFileSync(
        "contracts.json",
        JSON.stringify({
            governorFactoryAddress: governorFactoryAddress,
            timelockAddress: timelockAddress,
            erc20VotesAddress: erc20VotesAddress,
            erc721VotesAddress: erc721VotesAddress,
            standardGovernorAddress: standardGovernorAddress,
        }),
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const deployContractNoConstructor = async (
    client: Client,
    bytecode: string,
    name: string,
): Promise<{ contractId: ContractId; evmAddress: string }> => {
    const contractTx = new ContractCreateFlow()
        //Set the bytecode of Hedera contract
        .setBytecode(bytecode)
        //Set the gas to instantiate the contract
        .setGas(100000);
    //Provide the constructor parameters for the contract
    // .setConstructorParameters(
    //     new ContractFunctionParameters().addAddress(
    //         ethers.constants.AddressZero,
    //     ),
    // );
    console.log("Deploying", name, "contract...");
    //Submit the transaction to the Hedera test network
    const contractResponse = await contractTx.execute(client);

    //Get the receipt of the file create transaction
    const contractReceipt = await contractResponse.getReceipt(client);

    //Get the smart contract ID
    const newContractId = contractReceipt.contractId!;
    const newContractAddress = newContractId.toSolidityAddress();

    //Log the smart contract ID
    console.log(`The ${name} contract ID is`, newContractId);
    console.log(`The ${name} contract address is`, newContractAddress);
    return { contractId: newContractId, evmAddress: newContractAddress };
};

const submitExecTx = async (
    client: Client,
    contractExecTx: ContractExecuteTransaction,
) => {
    //Submit the transaction to a Hedera network and store the response
    const submitExecTx = await contractExecTx.execute(client);
    //Get the receipt of the transaction
    const receipt2 = await submitExecTx.getReceipt(client);
    //Confirm the transaction was executed successfully
    console.log("The transaction status is " + receipt2.status.toString());
};
