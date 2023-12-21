// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/* solhint-disable  no-global-import*/
import "../OpenzeppelinUpgradeable/governance/TimelockControllerUpgradeable.sol";

interface ITimelockControllerInitilizer {
    function initialize(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) external;
}
