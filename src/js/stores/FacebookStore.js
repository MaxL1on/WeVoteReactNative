import {ReduceStore} from 'flux/utils';
import Dispatcher from '../dispatcher/Dispatcher';
import FacebookConstants from "../constants/FacebookConstants";
import FacebookActions from "../actions/FacebookActions";
import FriendActions from "../actions/FriendActions";
import VoterActions from "../actions/VoterActions";

class FacebookStore extends ReduceStore {
  
  getInitialState (){
    return {
      authData: {},
      emailData: {},
      appRequestAlreadyProcessed: false,
      facebookFriendsNotExist: false,
      facebookInvitableFriendsRetrieved: false
    };
  }

  get facebookAuthData (){
    return this.getState().authData;
  }

  get facebookEmailData (){
    return this.getState().emailData;
  }

  get facebookUserId (){
    return this.getState().userId;
  }

  getFacebookAuthResponse () {
    return {
      accessToken: this.accessToken,
      facebookIsLoggedIn: this.loggedIn,
      userId: this.userId,
      // facebookPictureStatus: this.getState().facebookPictureStatus,
      // facebookPictureUrl: this.getState().facebookPictureUrl,
      facebook_retrieve_attempted: this.getState().facebook_retrieve_attempted,
      facebook_sign_in_found: this.getState().facebook_sign_in_found,
      facebook_sign_in_verified: this.getState().facebook_sign_in_verified,
      facebook_sign_in_failed: this.getState().facebook_sign_in_failed,
      facebook_secret_key: this.getState().facebook_secret_key,
      facebook_profile_image_url_https: this.getState().facebook_profile_image_url_https,
      voter_has_data_to_preserve: this.getState().voter_has_data_to_preserve,
      existing_facebook_account_found: this.getState().existing_facebook_account_found,
      voter_we_vote_id_attached_to_facebook: this.getState().voter_we_vote_id_attached_to_facebook,
      voter_we_vote_id_attached_to_facebook_email: this.getState().voter_we_vote_id_attached_to_facebook_email,
      // yes_please_merge_accounts: this.getState().yes_please_merge_accounts,
    };
  }

  getLoggedIn () {
    return this.getState().facebook_sign_in_verified || false;
  }

  get loggedIn () {
    if (!this.facebookAuthData) {
        return undefined;
    }

    return this.facebookAuthData.status === "connected";
  }

  get userId () {
    if (!this.facebookAuthData || !this.facebookAuthData.authResponse) {
        return undefined;
    }

    return this.facebookAuthData.authResponse.userID;
  }

  get accessToken () {
     return this.facebook_access_token || undefined;
  }
  // WebApp version forked 10/16/17
  // get accessToken () {
  //   if (!this.facebookAuthData || !this.facebookAuthData.authResponse) {
  //       return undefined;
  //   }
  //
  //   return this.facebookAuthData.authResponse.accessToken;
  // }

  facebookFriendsUsingWeVoteList (){
      return this.getDataFromArr(this.getState().facebook_friends_using_we_vote_list) || {};
  }

  facebookInvitableFriends () {
    return {
      facebook_invitable_friends_list: this.getDataFromArr(this.getState().facebookInvitableFriendsList),
      facebook_friends_not_exist: this.getState().facebookFriendsNotExist,
      facebook_invitable_friends_retrieved: this.getState().facebookInvitableFriendsRetrieved
    };
  }

  facebookAppRequestAlreadyProcessed (){
    return this.getState().appRequestAlreadyProcessed;
  }

  getDataFromArr (arr) {
    if (arr === undefined) {
      return [];
    }
    let data_list = [];
    for (let i = 0, len = arr.length; i < len; i++) {
      data_list.push( arr[i] );
    }
    return data_list;
  }

  reduce (state, action) {
    switch (action.type) {

      case FacebookConstants.FACEBOOK_LOGGED_IN:
        console.log("FACEBOOK_LOGGED_IN action.data:", action.data);
        FacebookActions.voterFacebookSignInAuth(action.data.authResponse);
        FacebookActions.getFacebookData();
        state.authData = action.data;
        return {
          ...state
        };

      case FacebookConstants.FACEBOOK_ACCESS_TOKEN:
        state.facebook_access_token = action.data;
        return {
          ...state
        };

      case FacebookConstants.FACEBOOK_RECEIVED_DATA:
        // Cache the data in the API server
        console.log("FACEBOOK_RECEIVED_DATA action.data:", action.data);
        FacebookActions.voterFacebookSignInData(action.data);
        // October 2017, why emailData... seems vestigial
        state.emailData = action.data;
        return {
          ...state
        };

      case FacebookConstants.FACEBOOK_RECEIVED_INVITABLE_FRIENDS:
        // console.log("FacebookStore, FacebookConstants.FACEBOOK_RECEIVED_INVITABLE_FRIENDS");
        // Cache the data in the API server
        // FacebookActions.getFacebookInvitableFriendsList(action.data.id);
        let facebook_friends_not_exist = false;
        let facebook_invitable_friends_retrieved = true;
        let facebook_invitable_friends_list = [];
        if (action.data.invitable_friends) {
          facebook_invitable_friends_list = action.data.invitable_friends.data;
        } else {
          facebook_friends_not_exist = true;
        }
        // console.log("FACEBOOK_RECEIVED_INVITABLE_FRIENDS: ", facebook_invitable_friends_list);
        state.facebookInvitableFriendsList = facebook_invitable_friends_list;
        state.facebookFriendsNotExist = facebook_friends_not_exist;
        state.facebookInvitableFriendsRetrieved = facebook_invitable_friends_retrieved;
        return {
          ...state
        };

      case FacebookConstants.FACEBOOK_READ_APP_REQUESTS:
        // console.log("FacebookStore appreqests:", action.data.apprequests);
        let app_request_already_processed = false;
        if (action.data.apprequests) {
          let apprequests_data = action.data.apprequests.data[0];
          let recipient_facebook_user_id = apprequests_data.to.id;
          let sender_facebook_id = apprequests_data.from.id;
          let facebook_request_id = apprequests_data.id;
          FriendActions.friendInvitationByFacebookVerify(facebook_request_id, recipient_facebook_user_id, sender_facebook_id);
        } else {
          app_request_already_processed = true;
        }
        // console.log("app_request_already_processed", app_request_already_processed);
        state.appRequestAlreadyProcessed = app_request_already_processed;
        return {
          ...state
        };

      case FacebookConstants.FACEBOOK_DELETE_APP_REQUEST:
        return {
          ...state
        };

      case "voterFacebookSignInRetrieve":
        console.log("FacebookStore voterFacebookSignInRetrieve, facebook_sign_in_verified: ", action.res.facebook_sign_in_verified);
        if (action.res.facebook_sign_in_verified) {
          VoterActions.voterRetrieve();
          /* Sept 6, 2017, has been replaced by facebook Game API friends list
          FacebookActions.facebookFriendsAction();
          */
        }
        state.voter_device_id = action.res.voter_device_id;
        state.voter_has_data_to_preserve = action.res.voter_has_data_to_preserve;
        state.facebook_retrieve_attempted = action.res.facebook_retrieve_attempted;
        state.facebook_sign_in_found = action.res.facebook_sign_in_found;
        state.facebook_sign_in_verified = action.res.facebook_sign_in_verified;
        state.facebook_sign_in_failed = action.res.facebook_sign_in_failed;
        state.facebook_secret_key = action.res.facebook_secret_key;
        // state.yes_please_merge_accounts = action.res.yes_please_merge_accounts;
        state.existing_facebook_account_found = action.res.existing_facebook_account_found;
        state.voter_we_vote_id_attached_to_facebook = action.res.voter_we_vote_id_attached_to_facebook;
        state.voter_we_vote_id_attached_to_facebook_email = action.res.voter_we_vote_id_attached_to_facebook_email;
        // state.facebook_email = action.res.facebook_email;
        // state.facebook_first_name = action.res.facebook_first_name;
        // state.facebook_middle_name = action.res.facebook_middle_name;
        // state.facebook_last_name = action.res.facebook_last_name;
        state.facebook_profile_image_url_https = action.res.facebook_profile_image_url_https;
        state.facebook_friends_list = action.res.facebook_friends_list;
        return {
          ...state
        };

      case "voterFacebookSignInSave":
        // console.log("FacebookStore voterFacebookSignInSave, minimum_data_saved: ", action.res.minimum_data_saved);
        if (action.res.minimum_data_saved) {
          // Only reach out for the Facebook Sign In information if the save_profile_data call has completed
          // TODO: We need a check here to prevent an infinite loop if the local voter_device_id isn't recognized by server
          // console.log("FacebookStore voterFacebookSignInSave, voter exists");
          FacebookActions.voterFacebookSignInRetrieve();
        }
        return {
          ...state
        };

      case "voterSignOut":
        return {
          authData: {},
          pictureData: {},
          emailData: {}
        };

      case "facebookSignInForget":
        // console.log("FacebookStore::facebookSignInForget");
        return {
          authData: {},
          pictureData: {},
          emailData: {}
        };

      /* Sept 6, 2017, has been replaced by facebook Game API friends list */
      case "facebookFriendsAction":
        state.facebook_friends_using_we_vote_list = action.res.facebook_friends_using_we_vote_list;
        return {
          ...state
        };

      case FacebookConstants.FACEBOOK_SIGN_IN_DISCONNECT:
        this.disconnectFromFacebook();
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

export default new FacebookStore(Dispatcher);
