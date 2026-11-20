import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

interface QueuedNavigation {
    name: keyof RootStackParamList;
    params?: any;
}

const queuedNavigations: QueuedNavigation[] = [];

const navigateNow = <RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
) => {
    const navigator = navigationRef as typeof navigationRef & {
        navigate: (screen: RouteName, routeParams?: RootStackParamList[RouteName]) => void;
    };

    navigator.navigate(name, params);
};

export const flushNavigationQueue = () => {
    if (!navigationRef.isReady()) return;

    while (queuedNavigations.length > 0) {
        const next = queuedNavigations.shift();
        if (next) {
            navigateNow(next.name, next.params);
        }
    }
};

export function navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
) {
    if (!navigationRef.isReady()) {
        queuedNavigations.push({ name, params });
        return;
    }

    navigateNow(name, params);
}

navigationRef.addListener('ready', flushNavigationQueue);
