import React, { Component } from "react";
import {
  Switch,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Actions } from 'react-native-router-flux';

import AccountMenuModal from "./AccountMenuModal";
import AnalyticsActions from "../../actions/AnalyticsActions";
import CookieStore from "../../stores/CookieStore";
import FacebookStore from "../../stores/FacebookStore";
import LoadingWheel from "../../components/LoadingWheel";
import RouteConst from "../RouteConst"
import SocialSignIn from "./SocialSignIn";
import styles from "../../stylesheets/components/baseStyles"
import TabStore from "../../stores/TabStore";
import TwitterStore from "../../stores/TwitterStore";
import VoterActions from "../../actions/VoterActions";
import VoterConstants from "../../constants/VoterConstants";
import VoterSessionActions from "../../actions/VoterSessionActions";
import VoterStore from "../../stores/VoterStore";
import WeVoteButton from "../../components/WeVoteButton"

const logging = require("../../utils/logging");
const delay_before_user_name_update_api_call = 1200;


export default class SignIn extends Component {
  constructor (props) {
    super(props);
    this.state = {
      facebook_auth_response: {},
      voter: VoterStore.getVoter(),
      first_name: VoterStore.getFirstName(),
      last_name: VoterStore.getLastName(),
      initial_name_loaded: false,
      name_saved_status: "",
      show_twitter_disconnect: false,
      showAccountMenuModal: false,
      newsletter_opt_in: VoterStore.getNotificationSettingsFlagState(VoterConstants.NOTIFICATION_NEWSLETTER_OPT_IN),
      notifications_saved_status: "",
      waiting_for_voter_device_id: true,
      initialized_voter_device_id: false,  // As of November 2017, This SignIn mounts multiple times
      dummy: false,
      signedInTwitter: null,
      signedInFacebook: null,
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.getInitialDeviceId = this.getInitialDeviceId.bind(this);
    this.updateNewsletterOptIn = this.updateNewsletterOptIn.bind(this);
    this.updateVoterName = this.updateVoterName.bind(this);
  }

  static onEnter = () => {
    logging.rnrfLog("onEnter to SignIn: currentScene = " + Actions.currentScene);
    // this 'Actions.refresh' triggers componentWillReceiveProps
    if (Actions.prevScene === "") {
      Actions.refresh({
        firstTimeToSignInTab: true
      });
    } else {
      Actions.refresh({
        firstTimeToSignInTab: false
      });
    }
  };

  static onExit = () => {
    logging.rnrfLog("onExit from SignIn: currentScene = " + Actions.currentScene);
  };

  // Set up this component upon first entry
  // componentDidMount is used in WebApp
  componentWillMount () {
    console.log("SignIn ++++ MOUNT currentScene = " + Actions.currentScene);

    // TODO:  November 2017, This assumes that the signin tab is the initial tab
    this.setState({waiting_for_voter_device_id: true});
    this.getInitialDeviceId();
    this._onVoterStoreChange();
    this.tabStoreListener = TabStore.addListener(this.onTabStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this._onVoterStoreChange.bind(this));
    AnalyticsActions.saveActionAccountPage(VoterStore.election_id());
  }

  componentWillReceiveProps(nextProps) {
    console.log("SignIn componentWillReceiveProps");

    if (! this.props.firstTimeToSignInTab) {
      // Show the AccountMenuModal first, every time you come to SignIn, except the first time
      this.setState({showAccountMenuModal: true});
    }

    const isTwitterSignedIn = TwitterStore.get().twitter_sign_in_verified === true;

    console.log("SignIn componentWillReceiveProps twitter = " + isTwitterSignedIn +
                ", facebook = " + FacebookStore.loggedIn);
    this.setState( {
      signedInTwitter: isTwitterSignedIn,
      signedInFacebook: FacebookStore.loggedIn,
    });
  }

  componentWillUnmount () {
    console.log("SignIn ---- UN mount");
    this.tabStoreListener.remove();
    this.voterStoreListener.remove();
    this.timer = null;
  }

  _onVoterStoreChange () {
    // console.log("SignIn _onVoterStoreChange");
    if (VoterStore.isVoterFound() && !this.state.initial_name_loaded) {
      this.setState({
        first_name: VoterStore.getFirstName(),
        last_name: VoterStore.getLastName(),
        initial_name_loaded: true,
        voter: VoterStore.getVoter(),
        newsletter_opt_in: VoterStore.getNotificationSettingsFlagState(VoterConstants.NOTIFICATION_NEWSLETTER_OPT_IN)
      });
    } else {
      this.setState({voter: VoterStore.getVoter()});
    }
  }

  onTabStoreChange () {
    // console.log("SignIn, onTabStoreChange currentScene: " + Actions.currentScene +", prevScene: " + Actions.prevScene);

    if( Actions.currentScene === Actions.prevScene &&
        Actions.currentScene === RouteConst.KEY_SIGNIN &&
        this.state.showAccountMenuModal === false ) {
      // console.log("SignIn, onTabStoreChange setting showAccountMenuModal true");
      this.setState({
        showAccountMenuModal: true
      });
    }
  }

  getInitialDeviceId () {
    console.log("SignIn getInitialDeviceId");
    if (CookieStore.getCurrentVoterDeviceId().length > 0) {
      this.setState({waiting_for_voter_device_id: false});
      this.setState({initialized_voter_device_id: true});
      console.log("SignIn getInitialDeviceId found cached voter_device_id ", CookieStore.getCurrentVoterDeviceId());
      return;
    }

    return CookieStore.getItem('voter_device_id').then(function (res) {
      this.setState({waiting_for_voter_device_id: false});
      this.setState({initialized_voter_device_id: true});
      console.log("SignIn getInitialDeviceId voter_device_id attempt prefetch", res);
    }.bind(this));
  }

  toggleTwitterDisconnectOpen () {
    this.setState({show_twitter_disconnect: true});
  }

  toggleTwitterDisconnectClose () {
    this.setState({show_twitter_disconnect: false});
  }

  voterSplitIntoTwoAccounts () {
    VoterActions.voterSplitIntoTwoAccounts();
    this.setState({show_twitter_disconnect: false});
  }

  handleKeyPress () {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      VoterActions.voterNameSave(this.state.first_name, this.state.last_name);
      this.setState({name_saved_status: "Saved"});
    }, delay_before_user_name_update_api_call);
  }

  updateVoterName (event) {
    if (event.target.name === "first_name") {
      this.setState({
        first_name: event.target.value,
        name_saved_status: "Saving First Name..."
      });
    } else if (event.target.name === "last_name") {
      this.setState({
        last_name: event.target.value,
        name_saved_status: "Saving Last Name..."
      });
    }
  }

  updateNewsletterOptIn (newsletter_opt_in) {
    if (newsletter_opt_in) {
      VoterActions.voterUpdateNotificationSettingsFlags(VoterConstants.NOTIFICATION_NEWSLETTER_OPT_IN);
      this.setState({ newsletter_opt_in: true });
    } else {
      VoterActions.voterUpdateNotificationSettingsFlags(VoterConstants.NOTIFICATION_ZERO, VoterConstants.NOTIFICATION_NEWSLETTER_OPT_IN);
      this.setState({ newsletter_opt_in: false });
    }
    this.setState({ notifications_saved_status: "Saved" });
  }

  signedOut () {
    console.log("signedOut --------------------");
    VoterSessionActions.voterSignOut();
    this.setState({
      signedInTwitter: false,
      signedInFacebook: false,
    });
  }

  toggleAccountMenuModal () {
    let show = this.state.showAccountMenuModal;
    console.log("ballot toggleAccountMenuModal called with show = " + show + "  and mounted = " + this.state.mounted);

    this.setState({
      signedInTwitter: TwitterStore.get().twitter_sign_in_verified === true,
      signedInFacebook: FacebookStore.loggedIn,
      showAccountMenuModal: !this.state.showAccountMenuModal
    });
  }


  render () {
    if (Actions.currentScene !== RouteConst.KEY_SIGNIN) {
      logging.renderLog("SignIn when NOT CURRENT, scene  = " + Actions.currentScene);
      return null;
    }

    logging.renderLog("SignIn  scene = " + Actions.currentScene);

    if(this.state.waiting_for_voter_device_id  && ! this.state.initialized_voter_device_id) {
      return <LoadingWheel text={'Device is initializing'}/>;
    }

    if ( this.state.showAccountMenuModal ) {
      logging.rnrfLog("Tabbed to SignIn, signedInTwitter: " + this.state.signedInTwitter +
        ", signedInFacebook: " + this.state.signedInFacebook +
        ", current = " + Actions.currentScene);

      return <AccountMenuModal toggleFunction={this.toggleAccountMenuModal.bind(this)} showModal={this.state.showAccountMenuModal} />;
    }


    if (!VoterStore.isVoterFound())  {
      console.log("SignIn.js, voterRetrieve in render()");
      VoterActions.voterRetrieve();
    }

    if (!this.state.voter){
      return <LoadingWheel text={'Loading your information'}/>;
    }

    // console.log("SignIn.jsx this.state.facebook_auth_response:", this.state.facebook_auth_response);
    if (!this.state.voter.signed_in_facebook && this.state.facebook_auth_response && this.state.facebook_auth_response.facebook_retrieve_attempted) {
      console.log("SignIn.jsx facebook_retrieve_attempted");
      // browserHistory.push("/facebook_sign_in");
      // return <Text>SignIn.jsx facebook_retrieve_attempted</Text>;
      return <LoadingWheel text={'Waiting for your information to arrive'}/>;
    }

    let {width} = Dimensions.get('window');
    let page_title = "Sign In - We Vote";
    let your_account_title = "Your Account";
    let your_account_explanation = "";
    if (this.state.voter.is_signed_in) {
      page_title = "Your Account - We Vote";
      if (this.state.voter.signed_in_facebook && !this.state.voter.signed_in_twitter) {
        your_account_title = "Have Twitter Too?";
        your_account_explanation = "By adding your Twitter account to your We Vote profile, you get access to the voter guides of everyone you follow.";
      } else if (this.state.voter.signed_in_twitter && !this.state.voter.signed_in_facebook) {
        your_account_title = "Have Facebook Too?";
        your_account_explanation = "By adding Facebook to your We Vote profile, it is easier to invite friends.";
      }
    }

    return <View style={styles.outer_gray_pane} >
        <View style={styles.inner_white_pane} >
          <View>
            {this.state.voter.is_signed_in ?
              <Text>{your_account_explanation}</Text> :
              <Text>Before you can share, either publicly or with friends, please sign in. Don't worry, we won't post
                anything automatically.</Text>
            }
          </View>
          <View style={{flex: 1, flexDirection: 'column', paddingTop: 15}}>
            {!this.state.signedInTwitter ?
              <SocialSignIn signIn isButton authenticator={'twitter'} buttonText={"Sign In"} />
            : null
            }
            {!this.state.signedInFacebook ?
              <SocialSignIn signIn isButton authenticator={'facebook'} buttonText={"Sign In"} />
            : null
            }
            {this.state.signedInTwitter || this.state.signedInFacebook ?
              <WeVoteButton buttonLabel={'Sign Out'} opacityStyles={[styles.buttonBasics, styles.signOutColors]}
                            onPress={this.signedOut.bind(this)}/> : null
            }
            {/* Please save these for testing, they send s a hard de-authenticate to the auth provider
            <SocialSignIn signOut isButton authenticator={'twitter'} buttonText={"Sign Out"} />
            <SocialSignIn signOut isButton authenticator={'facebook'} buttonText={"Sign Out"} />
            */}
          </View>
        </View>
    </View>;
  } // render
} // class
