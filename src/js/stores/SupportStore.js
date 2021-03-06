import {ReduceStore} from 'flux/utils';
import Dispatcher from '../dispatcher/Dispatcher';
import assign from 'object-assign';
import { mergeTwoObjectLists } from "../utils/textFormat";
import SupportActions from "../actions/SupportActions";

class SupportStore extends ReduceStore {

  getInitialState () {
    return {
      voter_supports: {},
      voter_opposes: {},
      support_counts: {},
      oppose_counts: {},
      is_public_position: {},
      voter_statement_text: {},
    };
  }

  get (ballot_item_we_vote_id) {
    if (!(this.supportList && this.opposeList && this.supportCounts && this.opposeCounts )){
      return undefined;
    }
    return {
      is_support: this.supportList[ballot_item_we_vote_id] || false,
      is_oppose: this.opposeList[ballot_item_we_vote_id] || false,
      is_public_position: this.isForPublicList[ballot_item_we_vote_id] || false,  // Default to friends only
      voter_statement_text: this.statementList[ballot_item_we_vote_id] || "",
      support_count: this.supportCounts[ballot_item_we_vote_id] || 0,
      oppose_count: this.opposeCounts[ballot_item_we_vote_id] || 0
    };
  }

  get supportList (){
    return this.getState().voter_supports || {};
  }

  get opposeList (){
    return this.getState().voter_opposes;
  }

  get isForPublicList (){
    return this.getState().is_public_position;
  }

  get statementList (){
    return this.getState().voter_statement_text;
  }

  get supportCounts (){
    return this.getState().support_counts;
  }

  get opposeCounts (){
    return this.getState().oppose_counts;
  }

  listWithChangedCount (list, ballot_item_we_vote_id, amount) {
    return assign({}, list, { [ballot_item_we_vote_id]: list[ballot_item_we_vote_id] + amount });
  }

  statementListWithChanges (statement_list, ballot_item_we_vote_id, new_voter_statement_text) {
    return assign({}, statement_list, { [ballot_item_we_vote_id]: new_voter_statement_text });
  }

  isForPublicListWithChanges (is_public_position_list, ballot_item_we_vote_id, is_public_position) {
    return assign({}, is_public_position_list, { [ballot_item_we_vote_id]: is_public_position });
  }

  // Turn action into a dictionary/object format with we_vote_id as key for fast lookup
  parseListToHash (property, list){
    let hash_map = {};
    list.forEach(el => {
      hash_map[el.ballot_item_we_vote_id] = el[property];
    });
    return hash_map;
  }

  reduce (state, action) {
    // Exit if we don't have a successful response (since we expect certain variables in a successful response below)
    if (!action.res || !action.res.success) {
      return {
        ...state
      };
    }

    let ballot_item_we_vote_id = "";
    if (action.res.ballot_item_we_vote_id) {
      ballot_item_we_vote_id = action.res.ballot_item_we_vote_id;
    }

    switch (action.type) {

      case "voterAddressRetrieve":
        SupportActions.voterAllPositionsRetrieve();
        SupportActions.positionsCountForAllBallotItems();
        return {
          ...state
        };

      case "voterAllPositionsRetrieve":
        // is_support is a property coming from 'position_list' in the incoming response
        // this.state.voter_supports is an updated hash with the contents of position list['is_support']
        state.voter_supports = this.parseListToHash("is_support", action.res.position_list);
        state.voter_opposes = this.parseListToHash("is_oppose", action.res.position_list);
        state.voter_statement_text = this.parseListToHash("statement_text", action.res.position_list);
        state.is_public_position = this.parseListToHash("is_public_position", action.res.position_list);
        return {
          ...state
        };

      case "positionsCountForAllBallotItems":
        let new_oppose_counts = this.parseListToHash("oppose_count", action.res.position_counts_list);
        let new_support_counts = this.parseListToHash("support_count", action.res.position_counts_list);
        let existing_oppose_counts = state.oppose_counts !== undefined ? state.oppose_counts : [];
        let existing_support_counts = state.support_counts !== undefined ? state.support_counts : [];

        // Duplicate values in the second array will overwrite those in the first
        state.oppose_counts = mergeTwoObjectLists(existing_oppose_counts, new_oppose_counts);
        state.support_counts = mergeTwoObjectLists(existing_support_counts, new_support_counts);
        return {
          ...state
        };

      case "positionsCountForOneBallotItem":
        let new_one_oppose_count = this.parseListToHash("oppose_count", action.res.position_counts_list);
        let new_one_support_count = this.parseListToHash("support_count", action.res.position_counts_list);
        let existing_oppose_counts2 = state.oppose_counts !== undefined ? state.oppose_counts : [];
        let existing_support_counts2 = state.support_counts !== undefined ? state.support_counts : [];

        // Duplicate values in the second array will overwrite those in the first
        state.oppose_counts = mergeTwoObjectLists(existing_oppose_counts2, new_one_oppose_count);
        state.support_counts = mergeTwoObjectLists(existing_support_counts2, new_one_support_count);
        return {
          ...state
        };

      case "voterOpposingSave":
        state.voter_supports = assign({}, state.voter_supports, { [ballot_item_we_vote_id]: false });
        state.voter_opposes = assign({}, state.voter_opposes, { [ballot_item_we_vote_id]: true });
        state.support_counts = state.voter_supports[ballot_item_we_vote_id] ?
                        this.listWithChangedCount(state.support_counts, ballot_item_we_vote_id, -1 ) :
                        state.support_counts;
        state.oppose_counts = this.listWithChangedCount(state.oppose_counts, ballot_item_we_vote_id, 1);
        return {
          ...state
        };

      case "voterStopOpposingSave":
        state.voter_opposes = assign({}, state.voter_opposes, { [ballot_item_we_vote_id]: false });
        state.oppose_counts = this.listWithChangedCount(state.oppose_counts, ballot_item_we_vote_id, -1);
        return {
          ...state
        };

      case "voterSupportingSave":
        state.voter_supports = assign({}, state.voter_supports, { [ballot_item_we_vote_id]: true });
        state.voter_opposes = assign({}, state.voter_opposes, { [ballot_item_we_vote_id]: false });
        state.support_counts = this.listWithChangedCount(state.support_counts, ballot_item_we_vote_id, 1);
        state.oppose_counts = state.voter_opposes[ballot_item_we_vote_id] ?
                        this.listWithChangedCount(state.oppose_counts, ballot_item_we_vote_id, -1) :
                        state.oppose_counts;
        return {
          ...state
        };

      case "voterStopSupportingSave":
        state.voter_supports = assign({}, state.voter_supports, { [ballot_item_we_vote_id]: false });
        state.support_counts = this.listWithChangedCount(state.support_counts, ballot_item_we_vote_id, -1);
        return {
          ...state
        };

      case "voterPositionCommentSave":
        // Add the comment to the list in memory
        state.voter_statement_text = this.statementListWithChanges(state.voter_statement_text, ballot_item_we_vote_id, action.res.statement_text);
        return {
          ...state
        };

      case "voterPositionVisibilitySave":
        // Add the visibility to the list in memory
        state.is_public_position = this.isForPublicListWithChanges(state.is_public_position, ballot_item_we_vote_id, action.res.is_public_position);
        return {
          ...state
        };

      default:
        return {
          ...state
        };
    }
  }
}

export default new SupportStore(Dispatcher);
