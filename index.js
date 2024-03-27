/**
 * @format
 */

import {AppRegistry} from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import Test from './Test';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => Test);
