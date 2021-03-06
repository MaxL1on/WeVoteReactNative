import React, { Component } from "react";
import PropTypes from 'prop-types';
import {
  Text,
  View
} from 'react-native';
import { Actions } from 'react-native-router-flux';

import RouteConst from "../RouteConst"
import TwitterActions from "../../actions/TwitterActions";
import TwitterStore from "../../stores/TwitterStore";
import VoterStore from "../../stores/VoterStore";
import LoadingWheel from "../../components/LoadingWheel";
import VoterActions from "../../actions/VoterActions";
import WarningModal from "../../components/Widgets/WarningModal"
const logging = require("../../utils/logging");
//import WouldYouLikeToMergeAccounts from "../../components/WouldYouLikeToMergeAccounts";

export default class TwitterSignInProcess extends Component {
  static propTypes = {
    params: PropTypes.object,
  };

  constructor (props) {
    super(props);
    this.state = {
      twitter_auth_response: {},
      saving: false,
      voter: {},
      yes_please_merge_accounts: false
    };
  }

  static onEnter = () => {
    logging.rnrfLog("onEnter to TwitterSignInProcess: currentScene = " + Actions.currentScene);
    Actions.refresh({
      dummy: 'helloFromTwitterSignInProcess',
    });

  };

  static onExit = () => {
    logging.rnrfLog("onExit from TwitterSignInProcess: currentScene = " + Actions.currentScene);
  };

  // componentDidMount ()  Doesn't work in react-native?
  componentWillMount () {
    console.log("TwitterSignInProcess ++++ MOUNT");
    this.twitterStoreListener = TwitterStore.addListener(this._onTwitterStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this._onVoterStoreChange.bind(this));
  }

  componentWillUnmount () {
    console.log("TwitterSignInProcess ---- UN mount ");
    this.twitterStoreListener.remove();
    this.voterStoreListener.remove();
  }

  _onTwitterStoreChange () {
    console.log("TwitterSignInProcess _onTwitterStoreChange() AAAAAAAAAAAAA");
    if( TwitterStore.get().twitter_sign_in_found ) {
      console.log("TwitterSignInProcess _onTwitterStoreChange() TwitterStore.get().twitter_sign_in_found DID DID DID succeed ");
      VoterActions.voterRetrieve();  // Load the voter, so they will be available on the Ballot tab, New October 31, 2017
    } else {
      console.log("TwitterSignInProcess _onTwitterStoreChange() TwitterStore.get().twitter_sign_in_found did NOT succeed ");
    }
    const twitter_auth_response = TwitterStore.getTwitterAuthResponse();
    if( twitter_auth_response && twitter_auth_response.twitter_sign_in_verified ) {
      logging.rnrfLog("twitterSignInProcess, twitter_auth_response && twitter_auth_response.twitter_sign_in_verified so navigating to SignIn then immediately to Ballot");
      Actions.signIn({came_from: 'TwitterSignInProcess'});  // First navigate to the initial scene for this stack on this tab
      Actions.ballot({came_from: TwitterSignInProcess});    // Then navigate to the desired initial scene on another tab
    } else {
      this.setState({
        twitter_auth_response: twitter_auth_response,
        saving: false
      });
    }
  }

  _onVoterStoreChange () {
    console.log("TwitterSignInProcess _onVoterStoreChange() AAAAAAAAAAAAA");

    let voter = VoterStore.getVoter();
    if( voter ) {
      console.log("TwitterSignInProcess _onVoterStoreChange() voter =  " + voter);
      this.setState({
        voter: voter,
      });
    } else {
      console.log("TwitterSignInProcess _onVoterStoreChange() VoterStore.getVoter() did NOT succeed ");
    }
  }

  cancelMergeFunction () {
    // browserHistory.push({
    //   pathname: "/more/network",
    //   state: {
    //   }
    // });
    // message: "You have chosen to NOT merge your two accounts.",
    // message_type: "success"
  }

  voterMergeTwoAccountsByTwitterKey (twitter_secret_key, voter_has_data_to_preserve = true) {
    VoterActions.voterMergeTwoAccountsByTwitterKey(twitter_secret_key);
    logging.rnrfLog("twitterSignInProcess  Actions.ballot({");
    Actions.ballot({
      came_from: 'TwitterSignInProcess voterMergeTwo',
      sign_in_message: 'You have successfully signed in with Twitter.',
      sign_in_message_type: 'success',
    });
  }

  voterTwitterSaveToCurrentAccount () {
    VoterActions.voterTwitterSaveToCurrentAccount();
    // browserHistory.push({
    //   pathname: "/more/network",
    //   state: {
    //     message: "You have successfully signed in with Twitter.",
    //     message_type: "success"
    //   }
    // });
    if (VoterStore.getVoterPhotoUrlMedium().length === 0) {
      // This only fires once, for brand new users on their very first login
      VoterActions.voterRetrieve();
    }
  }

  twitterSignInRetrieve () {
    console.log("TwitterSignInProcess firing TwitterActions.twitterSignInRetrieve();");
    TwitterActions.twitterSignInRetrieve();
    this.setState({saving: true});
  }

  yesPleaseMergeAccounts () {
    this.setState({yes_please_merge_accounts: true});
  }

  toggleWarningModal () {
     this.setState({
      showWarningModal: !this.state.showWarningModal
    });
  }

  render () {
    if ( Actions.currentScene !== "twitterSignInProcess") {
      logging.renderLog("TwitterSignInProcess, when NOT CURRENT, scene  = " + Actions.currentScene);
      return null;
    }
    logging.renderLog("TwitterSignInProcess render, scene = " + Actions.currentScene);
    console.log("TwitterSignInProcess render");

    let {twitter_auth_response, yes_please_merge_accounts} = this.state;

    // Wait until twitterSignInRetrieve promise is resolved, and twitter_auth_response is populated
    if (this.state.saving ||
      !twitter_auth_response ||
      !twitter_auth_response.twitter_retrieve_attempted ) {
      return <LoadingWheel text={['Twitter authentication was successful.', 'Retrieving data from the We Vote cloud.']}/>;
     }

    console.log("=== Passed initial gate ===");
    console.log("twitter_auth_response:", twitter_auth_response);
    let { twitter_secret_key } = twitter_auth_response;

    if (twitter_auth_response.twitter_sign_in_failed) {
      console.log("Twitter sign in failed - in future, push to /more/sign_in");
      return <WarningModal text={['Twitter sign in failed', 'Please try again later']}
                           toggleFunction={this.toggleWarningModal.bind(this)}
                           show={this.state.showWarningModal}/>;
    }

    if (yes_please_merge_accounts) {
      // Go ahead and merge this voter record with the voter record that the twitter_secret_key belongs to
      // console.log("this.voterMergeTwoAccountsByTwitterKey -- yes please merge accounts");
      this.voterMergeTwoAccountsByTwitterKey(twitter_secret_key);
      // return <span>this.voterMergeTwoAccountsByTwitterKey({twitter_secret_key})</span>;
      return <LoadingWheel text={'Merging your data from before you signed in'} />;
    }

    // This process starts when we return from attempting voterTwitterSignInRetrieve
    // If twitter_sign_in_found NOT True, go back to the sign in page to try again
    if (!twitter_auth_response.twitter_sign_in_found) {
      console.log("twitter_auth_response.twitter_sign_in_found", twitter_auth_response.twitter_sign_in_found);
      // browserHistory.push({
      //   pathname: "/more/sign_in",
      //   state: {
      //     message: "Twitter authentication not found. Please try again.",
      //     message_type: "warning"
      //   }
      // });
      return <LoadingWheel text={'Twitter authentication not found. Please try again.'} />;
    }

    if (twitter_auth_response.existing_twitter_account_found) {
      // Is there anything to save from this voter account?
      if (twitter_auth_response.voter_has_data_to_preserve) {
        console.log("TwitterSignInProcess voter_has_data_to_preserve is TRUE");
        const cancel_merge_function = this.cancelMergeFunction.bind(this);
        const please_merge_accounts_function = this.yesPleaseMergeAccounts.bind(this);
        // Display the question of whether to merge accounts or not
        return <WouldYouLikeToMergeAccounts cancelMergeFunction={cancel_merge_function}
                                            pleaseMergeAccountsFunction={please_merge_accounts_function} />;
        // return <span>WouldYouLikeToMergeAccounts</span>;
      } else {
        // Go ahead and merge the accounts, which means deleting the current voter and switching to the twitter-linked account
        console.log("TwitterSignInProcess this.voterMergeTwoAccountsByTwitterKey - No data to merge");
        this.voterMergeTwoAccountsByTwitterKey(twitter_secret_key, twitter_auth_response.voter_has_data_to_preserve);
        // return <span>this.voterMergeTwoAccountsByTwitterKey({twitter_secret_key}); - No data to merge</span>;
        return <LoadingWheel text={'Merging your data from before you signed in'}/>;
      }
    } else {
      console.log("Setting up new Twitter entry - voterTwitterSaveToCurrentAccount");
      this.voterTwitterSaveToCurrentAccount();
      //return <span>Setting up new Twitter entry - voterTwitterSaveToCurrentAccount</span>;
      return <LoadingWheel text={'Saving your data from before you signed in'}/>;
    }
  }
}
