import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
) {
    if (navigationRef.isReady()) {
        const navigator = navigationRef as typeof navigationRef & {
            navigate: (screen: RouteName, routeParams?: RootStackParamList[RouteName]) => void;
        };

        navigator.navigate(name, params);
    }
}
