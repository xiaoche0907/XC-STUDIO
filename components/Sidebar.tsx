import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home as HomeIcon,
  Folder,
  User,
  Info,
  Plus,
  Settings,
} from "lucide-react";

interface SidebarProps {
  onNewProject?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewProject }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNewProject = () => {
    if (onNewProject) {
      onNewProject();
    } else {
      navigate(`/workspace/new-${Date.now()}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50"
    >
      <div>
        <button
          onClick={handleNewProject}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-black text-white hover:scale-105"
          title="新建项目"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="w-12 py-6 bg-white/80 backdrop-blur-md rounded-full shadow-xl flex flex-col items-center gap-6 border border-white/20">
        <button
          onClick={() => navigate("/")}
          className={`p-2 rounded-full transition ${
            isActive("/")
              ? "bg-gray-100 text-black shadow-sm"
              : "text-gray-400 hover:text-black hover:bg-gray-50"
          }`}
          title="首页"
        >
          <HomeIcon size={20} />
        </button>
        <button
          onClick={() => navigate("/projects")}
          className={`p-2 rounded-full transition ${
            isActive("/projects")
              ? "bg-gray-100 text-black shadow-sm"
              : "text-gray-400 hover:text-black hover:bg-gray-50"
          }`}
          title="项目"
        >
          <Folder size={20} />
        </button>
        <button
          className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition"
          title="用户中心"
        >
          <User size={20} />
        </button>
        <button
          className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition"
          title="信息"
        >
          <Info size={20} />
        </button>
        <button
          onClick={() => navigate("/settings")}
          className={`p-2 rounded-full transition ${
            isActive("/settings")
              ? "bg-gray-100 text-black shadow-sm"
              : "text-gray-400 hover:text-black hover:bg-gray-50"
          }`}
          title="设置 / API Key"
        >
          <Settings size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
