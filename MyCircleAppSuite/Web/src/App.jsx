import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import DialogProvider from './components/ui/DialogProvider';
import Loading from './components/ui/Loading';

const Home = lazy(() => import('./pages/Home'));
const Feed = lazy(() => import('./pages/Feed'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Requests = lazy(() => import('./pages/Requests'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const PostDetails = lazy(() => import('./pages/PostDetails'));
const Chat = lazy(() => import('./pages/Chat'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotFound = lazy(() => import('./pages/NotFound'));
const MyPosts = lazy(() => import('./pages/MyPosts'));
const Settings = lazy(() => import('./pages/Settings'));
const BlockedUsers = lazy(() => import('./pages/BlockedUsers'));

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <DialogProvider>
                  <Layout>
                    <Suspense fallback={<Loading fullscreen text="Loading page..." />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/feed" element={<Feed />} />
                        <Route path="/create-post" element={<CreatePost />} />
                        <Route path="/my-posts" element={<MyPosts />} />
                        <Route path="/requests" element={<Requests />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/edit-profile" element={<EditProfile />} />
                        <Route path="/post/:id" element={<PostDetails />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/blocked-users" element={<BlockedUsers />} />
                        <Route path="/login/success" element={<Home />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </DialogProvider>
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
