import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { FeedPage } from './pages/FeedPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { ProfilePage } from './pages/ProfilePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { EditPostPage } from './pages/EditPostPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { PublicFeedPage } from './pages/PublicFeedPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginSuccessPage } from './pages/LoginSuccessPage';
import { NotificationsPage } from './pages/NotificationsPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<PublicFeedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/success" element={<LoginSuccessPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Admin Route - Separate from Main Layout */}
        <Route path="/admin" element={<AdminDashboardPage />} />

        {/* Protected App Routes */}
        <Route element={<Layout />}>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/posts/:id/edit" element={<EditPostPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Catch all redirect to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;