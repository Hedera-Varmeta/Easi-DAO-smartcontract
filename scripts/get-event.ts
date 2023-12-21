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
import * as erc721VotesTemplate from "../artifacts/contracts/VoteTokens/ERC721Votes.sol/ERC721VotesStandard.json";
import * as governorFactoryTemplate from "../artifacts/contracts/GovernorFactory.sol/GovernorFactory.json";
import * as dotenv from "dotenv";
import axios from "axios";
import { AbiCoder } from "ethers/lib/utils";
var Web3 = require("web3");
var web3 = new Web3();
dotenv.config();
import abi from "../artifacts/contracts/GovernorFactory.sol/GovernorFactory.json";

function decodeEvent(eventName: string, log: string, topics: string[]) {
    const eventAbi = abi.abi.find(
        (event) => event.name === eventName && event.type === "event"
    );
    let decodedLog;
    if (eventAbi) {
        decodedLog = web3.eth.abi.decodeLog(eventAbi.inputs, log, topics);
        console.log(decodedLog)
    }
    return decodedLog;
}


async function getEventsFromMirror(contractId: ContractId) {
    const delay = (ms: any) => new Promise((res) => setTimeout(res, ms));
    console.log(`\nGetting event(s) from mirror`);
    // console.log(`Waiting 10s to allow transaction propagation to mirror`);
    // await delay(10000);
    const url = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${contractId.toString()}/results/logs?order=asc`;

    await axios
        .get(url)
        .then((response) => {
            const jsonResponse = response.data;

            jsonResponse.logs.forEach((log: any) => {
                if (log.data === "0x") {
                    return;
                }
                // decode the event data
                const event = decodeEvent("GovernorCreated", log.data, log.topics);

                // output the from address and message stored in the event
                console.log(
                    `Mirror event(s): from '${AccountId.fromSolidityAddress(
                        event.from
                    ).toString()}' update to '${event.message}'`
                );
            });
        })
        .catch(function (err) {
            console.error(err);
        });
}

async function main() {
    const contractId = ContractId.fromString("0.0.13943472");
    // await getEventsFromMirror(contractId);
    await decodeEvent("GovernorCreated", "0x0000000000000000000000000000000000000000000000000000000000000005000000000000000000000000493955435c42209546550c492ddb78ee9f9cc4ce000000000000000000000000e090429274364b5a52ee00643b5586c90577c10f000000000000000000000000a7ac15c03628a47254df67337965b5bac3cd93be", ["0x4890248a3d058ddfcda4ef3861fca10627f6b078a3eb0cb70f0f4b0f65b759ea"])

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
