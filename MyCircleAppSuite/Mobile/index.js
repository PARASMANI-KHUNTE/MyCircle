/**
 * @format
 */

import 'react-native-gesture-handler';
import './global.css';
import { AppRegistry } from 'react-native';
import App from './App';
import appConfig from './app.json';

const appName = appConfig.name || 'MyCircleMobileBare';

AppRegistry.registerComponent(appName, () => App);
