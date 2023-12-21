// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/* solhint-disable  no-global-import*/
import "../Treasury/Treasury.sol";

interface ITreasuryInitializer {
    function initialize(
        address timeLockAddress
    ) external;
}
