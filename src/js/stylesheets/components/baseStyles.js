import {
  StyleSheet,
} from 'react-native';

// Border Radius
// * Uses a slightly shifted scale to acknowledge smaller common values
let radius_none= 0; // for overrides
let radius_xs = 8;
let radius_sm = 4;
let radius_md = 8;
let radius_rounded = 6;

// https://www.bountysource.com/issues/39479584-fontfamily-in-theme-js-has-no-effect
// There is no out-of-the-box sans-serif in iOS, so used Arial instead.  Works fine on Android.
const base_styles = StyleSheet.create({
  baseText: {
    fontFamily: 'Arial',
  },
  title_text: {
    fontFamily: 'Arial',
    fontSize: 15,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    marginBottom: 10
  },
  button_text: {
    fontSize: 18,
    color: 'white',
    alignSelf: 'center'
  },
  button: {
    height: 36,
    backgroundColor: '#48BBEC',
    borderColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    paddingRight: 16,
    paddingLeft: 5,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    width: 150
  },
  facebook_button: {
    height: 36,
    backgroundColor: '#3b5998',
    borderColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    paddingRight: 16,
    paddingLeft: 5,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    width: 150
  },
  facebook_icon: {
    width: 24,
    height: 24,
    marginTop: 6, marginRight: 4, marginLeft:4
  },
  danger_button: {
    height: 36,
    backgroundColor: 'red',
    borderColor: '#48BBEC',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
    justifyContent: 'center'
  },
  outer_gray_pane: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  inner_white_pane: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: 'white',
      alignSelf: 'stretch',
      padding: 20
  },
  activity_indicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 80
  },
  title_padded_text: {
    fontFamily: 'Arial',
    fontSize: 15,
    fontWeight: 'bold',
    paddingBottom: 12
  },
  card: {
    padding: 10,
  },
  card_main: {
    padding: 16,
    display: 'flex',
    backgroundColor: '#fff',
    position: 'relative',
  },
  media_object: {
    padding: 10,
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative',
    flexDirection: 'row',
  },
  media_object_content: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  media_object_anchor: {
    width: 50,
    display: 'flex',
    flexDirection: 'column',
    marginRight: 10,
  },
  display_name: {
    fontFamily: "Source Sans Pro",
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  avatar_compressed: {
    maxWidth: 40,
    borderRadius: radius_xs,
  },
  leftIndent: {
    paddingLeft: 25,
  },
  topRoomForPhoneMenu: {
    paddingTop: 50
  },
  grayPromise: {
    fontFamily: 'Arial',
    fontSize: 15,
    fontWeight: 'bold',
    paddingBottom: 20,
    color: 'darkgray',
  },
  modalChoices: {
    paddingLeft: 25,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: 'Arial',
    fontSize: 20,
    color: '#00749e'
  },
  modalChoiceDummy: {   // Nov 2017, this is temporary for mockups
    paddingLeft: 25,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: 'Arial',
    fontSize: 20,
  }

});

export default base_styles;