import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import WorkspaceNew from './pages/Workspace/WorkspaceNew';
import Projects from './pages/Projects';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/workspace/:id" element={<Workspace />} />
          {/* 新版Workspace - 使用Store和组件化架构 */}
          <Route path="/workspace-new/:id" element={<WorkspaceNew />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
