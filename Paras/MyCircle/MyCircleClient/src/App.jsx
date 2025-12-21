import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import Requests from './pages/Requests';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import PostDetails from './pages/PostDetails';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import MyPosts from './pages/MyPosts';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Layout>
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
                <Route path="/settings" element={<Settings />} />
                <Route path="/login/success" element={<Home />} /> {/* Temporary redirect handler */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
