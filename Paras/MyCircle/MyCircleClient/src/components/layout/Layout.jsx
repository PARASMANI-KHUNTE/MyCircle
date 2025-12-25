import React from 'react';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    // All pages handle their own layout now
    return children;
};

export default Layout;
