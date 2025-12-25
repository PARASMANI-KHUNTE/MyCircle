import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import PostDetails from './pages/PostDetails';
import NotFound from './pages/NotFound';
import BlockedUsers from './pages/BlockedUsers';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import DialogProvider from './components/ui/DialogProvider';
import Dashboard from './dashboard/Dashboard';

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
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/feed" element={<Feed />} />
                      <Route path="/post/:id" element={<PostDetails />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/blocked-users" element={<BlockedUsers />} />
                      <Route path="/login/success" element={<Home />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
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
