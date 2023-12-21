// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (governance/extensions/GovernorPreventLateQuorum.sol)

pragma solidity ^0.8.0;

import "../GovernorUpgradeable.sol";
import "../../utils/math/MathUpgradeable.sol";
import "../../proxy/utils/Initializable.sol";

/**
 * @dev A module that ensures there is a minimum voting period after quorum is reached. This prevents a large voter from
 * swaying a vote and triggering quorum at the last minute, by ensuring there is always time for other voters to react
 * and try to oppose the decision.
 *
 * If a vote causes quorum to be reached, the proposal's voting period may be extended so that it does not end before at
 * least a given number of blocks have passed (the "vote extension" parameter). This parameter can be set by the
 * governance executor (e.g. through a governance proposal).
 *
 * _Available since v4.5._
 */
abstract contract GovernorPreventLateQuorumUpgradeable is
    Initializable,
    GovernorUpgradeable
{
    using SafeCastUpgradeable for uint256;
    using TimersUpgradeable for TimersUpgradeable.BlockNumber;

    uint64 private _voteExtension;
    mapping(bytes32 => TimersUpgradeable.BlockNumber)
        private _extendedDeadlines;

    /// @dev Emitted when a proposal deadline is pushed back due to reaching quorum late in its voting period.
    event ProposalExtended(bytes32 indexed proposalId, uint64 extendedDeadline);

    /// @dev Emitted when the {lateQuorumVoteExtension} parameter is changed.
    event LateQuorumVoteExtensionSet(
        uint64 oldVoteExtension,
        uint64 newVoteExtension
    );

    /**
     * @dev Initializes the vote extension parameter: the number of blocks that are required to pass since a proposal
     * reaches quorum until its voting period ends. If necessary the voting period will be extended beyond the one set
     * at proposal creation.
     */
    function __GovernorPreventLateQuorum_init(
        uint64 initialVoteExtension
    ) internal onlyInitializing {
        __GovernorPreventLateQuorum_init_unchained(initialVoteExtension);
    }

    function __GovernorPreventLateQuorum_init_unchained(
        uint64 initialVoteExtension
    ) internal onlyInitializing {
        _setLateQuorumVoteExtension(initialVoteExtension);
    }

    /**
     * @dev Returns the proposal deadline, which may have been extended beyond that set at proposal creation, if the
     * proposal reached quorum late in the voting period. See {Governor-proposalDeadline}.
     */
    function proposalDeadline(
        bytes32 proposalId
    ) public view virtual override returns (uint256) {
        return
            MathUpgradeable.max(
                super.proposalDeadline(proposalId),
                _extendedDeadlines[proposalId].getDeadline()
            );
    }

    /**
     * @dev Casts a vote and detects if it caused quorum to be reached, potentially extending the voting period. See
     * {Governor-_castVote}.
     *
     * May emit a {ProposalExtended} event.
     */
    function _castVote(
        bytes32 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual override returns (uint256) {
        uint256 result = super._castVote(
            proposalId,
            account,
            support,
            reason,
            params
        );

        TimersUpgradeable.BlockNumber
            storage extendedDeadline = _extendedDeadlines[proposalId];

        if (extendedDeadline.isUnset() && _quorumReached(proposalId)) {
            uint64 extendedDeadlineValue = block.number.toUint64() +
                lateQuorumVoteExtension();

            if (extendedDeadlineValue > proposalDeadline(proposalId)) {
                emit ProposalExtended(proposalId, extendedDeadlineValue);
            }

            extendedDeadline.setDeadline(extendedDeadlineValue);
        }

        return result;
    }

    /**
     * @dev Returns the current value of the vote extension parameter: the number of blocks that are required to pass
     * from the time a proposal reaches quorum until its voting period ends.
     */
    function lateQuorumVoteExtension() public view virtual returns (uint64) {
        return _voteExtension;
    }

    /**
     * @dev Changes the {lateQuorumVoteExtension}. This operation can only be performed by the governance executor,
     * generally through a governance proposal.
     *
     * Emits a {LateQuorumVoteExtensionSet} event.
     */
    function setLateQuorumVoteExtension(
        uint64 newVoteExtension
    ) public virtual onlyGovernance {
        _setLateQuorumVoteExtension(newVoteExtension);
    }

    /**
     * @dev Changes the {lateQuorumVoteExtension}. This is an internal function that can be exposed in a public function
     * like {setLateQuorumVoteExtension} if another access control mechanism is needed.
     *
     * Emits a {LateQuorumVoteExtensionSet} event.
     */
    function _setLateQuorumVoteExtension(
        uint64 newVoteExtension
    ) internal virtual {
        emit LateQuorumVoteExtensionSet(_voteExtension, newVoteExtension);
        _voteExtension = newVoteExtension;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[48] private __gap;
}
