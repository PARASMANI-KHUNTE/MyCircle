import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
    Feed: undefined;
    MapView: { viewMode: 'map' } | undefined;
    CreatePost: undefined;
    Requests: undefined;
    Profile: undefined;
};

export type RootStackParamList = {
    Landing: undefined;
    Welcome: undefined;
    Login: undefined;
    Register: undefined;
    LoginSuccess: { token?: string } | undefined;
    MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
    Notifications: undefined;
    PostDetails: { id: string };
    ChatList: undefined;
    ChatWindow: { conversation?: unknown; id?: string } | undefined;
    Settings: undefined;
    EditProfile: undefined;
    MyPosts: undefined;
    Requests: undefined;
    BlockedUsers: undefined;
    UserProfile: { userId?: string } | undefined;
    EditPost: { id: string };
    Wallet: undefined;
    NotFound: { path?: string } | undefined;
};

export type WebRoutePath =
    | '/'
    | '/explore'
    | '/welcome'
    | '/login'
    | '/login/success'
    | '/create-post'
    | '/edit-post/:id'
    | '/my-posts'
    | '/requests'
    | '/profile'
    | '/edit-profile'
    | '/post/:id'
    | '/notifications'
    | '/chat'
    | '/settings'
    | '/blocked-users'
    | '*';

export const webToMobileRouteMap: Record<WebRoutePath, string> = {
    '/': 'MainTabs > Feed',
    '/explore': 'MainTabs > Feed',
    '/welcome': 'Welcome',
    '/login': 'Login',
    '/login/success': 'LoginSuccess',
    '/create-post': 'MainTabs > CreatePost',
    '/edit-post/:id': 'EditPost',
    '/my-posts': 'MyPosts',
    '/requests': 'Requests',
    '/profile': 'MainTabs > Profile',
    '/edit-profile': 'EditProfile',
    '/post/:id': 'PostDetails',
    '/notifications': 'Notifications',
    '/chat': 'ChatList',
    '/settings': 'Settings',
    '/blocked-users': 'BlockedUsers',
    '*': 'NotFound',
};

