import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import Projects from './pages/Projects';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#F9FAFB] text-gray-900 overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/workspace/:id" element={<Workspace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;