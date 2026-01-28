import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/1_HomePage/HomePage';

interface AppRoutesProps {
  toggleColorMode: () => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ toggleColorMode }) => {
  return (
    <Routes>
      <Route path="/" element={<HomePage toggleColorMode={toggleColorMode} />} />
      {/* 在这里添加更多路由 */}
      <Route path="/about" element={<div>About Page</div>} />
      <Route path="/contact" element={<div>Contact Page</div>} />
    </Routes>
  );
};

export default AppRoutes;