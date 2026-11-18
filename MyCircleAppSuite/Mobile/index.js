/**
 * @format
 */

import 'react-native-gesture-handler';
import './global.css';
import { AppRegistry } from 'react-native';
import App from './App';
import appConfig from './app.json';

// Global error handler to catch unhandled JS exceptions
if (typeof global.ErrorUtils !== 'undefined') {
    const defaultHandler = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('[GlobalErrorHandler] Uncaught exception:', error, 'isFatal:', isFatal);
        if (defaultHandler) {
            defaultHandler(error, isFatal);
        }
    });
}

const appName = appConfig.name || 'MyCircleMobileBare';

AppRegistry.registerComponent(appName, () => App);
