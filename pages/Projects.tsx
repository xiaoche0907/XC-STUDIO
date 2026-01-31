import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, Folder, User, Info, Plus, Bell, ChevronDown, 
  Box, Image as ImageIcon, Video, Hash
} from 'lucide-react';
import { Project } from '../types';
import { getProjects } from '../services/storage';

const Sidebar = () => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setShowMenu(false);
        navigate(`/workspace/new-${Date.now()}`, { 
          state: { 
            backgroundType: type,
            backgroundUrl: result 
          } 
        });
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowMenu(!showMenu)} 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                    showMenu ? 'bg-gray-900 text-white scale-105 rotate-45' : 'bg-black text-white hover:scale-105'
                }`}
            >
            <Plus size={24} />
            </button>

            {showMenu && (
                <div className="absolute left-full top-0 ml-4 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="px-3 py-2 text-xs text-gray-400 font-medium">新增</div>
                    
                    <label className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition cursor-pointer group">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                        <ImageIcon size={18} className="text-gray-500 group-hover:text-black transition" /> 
                        <span>上传图片</span>
                    </label>
                    
                    <label className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition cursor-pointer group">
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                        <Video size={18} className="text-gray-500 group-hover:text-black transition" /> 
                        <span>上传视频</span>
                    </label>
                    
                    <div className="my-1 border-b border-gray-50"></div>
                    
                    <button 
                        onClick={() => {
                            setShowMenu(false);
                            navigate('/workspace/new');
                        }} 
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition group"
                    >
                        <div className="flex items-center gap-3">
                            <Hash size={18} className="text-gray-500 group-hover:text-black transition" /> 
                            <span>智能画板</span>
                        </div>
                        <span className="text-xs text-gray-300 font-sans font-medium">F</span>
                    </button>
                </div>
            )}
        </div>

        <div className="w-12 py-6 bg-white rounded-full shadow-lg flex flex-col items-center gap-6 border border-gray-100">
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition"><HomeIcon size={20} /></button>
          <button onClick={() => navigate('/projects')} className="p-2 bg-gray-100 text-black rounded-full transition hover:bg-gray-200"><Folder size={20} /></button>
          <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition"><User size={20} /></button>
          <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition"><Info size={20} /></button>
        </div>
      </div>
    );
};

const Header = () => (
  <header className="fixed top-0 left-0 right-0 h-16 px-8 flex items-center justify-between z-40 bg-[#F9FAFB]/90 backdrop-blur-sm">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">XC</div>
      <span className="font-bold text-xl tracking-tight">XcAISTUDIO</span>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-sm font-medium text-gray-600 flex items-center gap-1 cursor-pointer">
        简体中文 <ChevronDown size={14} />
      </div>
      <button className="p-2 rounded-full hover:bg-gray-200 transition">
        <Bell size={20} className="text-gray-600" />
      </button>
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 cursor-pointer">
         <img src="https://cdn.jsdelivr.net/gh/xiaoche0907/pic-bed@main/img_1769761984824_282_11dff4f8-a0df-43a9-b0db-09a846b50d34.jpg" alt="User" />
      </div>
    </div>
  </header>
);

interface ProjectCardProps {
  project?: Project;
  isNew?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isNew = false }) => {
    const navigate = useNavigate();
    
    if (isNew) {
      return (
        <div 
          onClick={() => navigate(`/workspace/new-${Date.now()}`)}
          className="aspect-[4/3] bg-[#F3F4F6] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition group"
        >
          <Plus size={32} className="text-gray-900 group-hover:scale-110 transition" />
          <span className="mt-2 text-sm font-medium text-gray-900">新建项目</span>
        </div>
      );
    }
  
    return (
      <div 
        onClick={() => navigate(`/workspace/${project?.id}`)}
        className="flex flex-col gap-2 cursor-pointer group"
      >
        <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden border border-gray-100 group-hover:shadow-md transition relative">
          {project?.thumbnail ? (
              <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
          ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200 bg-[#F3F4F6]">
                  {/* Empty state placeholder */}
                  <Box size={32} className="opacity-20" />
              </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 truncate">{project?.title || '未命名'}</h3>
          <p className="text-xs text-gray-400">更新于 {project?.updatedAt}</p>
        </div>
      </div>
    );
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const load = async () => {
        const loadedProjects = await getProjects();
        setProjects(loadedProjects);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <Header />
      <Sidebar />
      
      <main className="pt-24 px-[10%] max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-bold mb-8">项目</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <ProjectCard isNew />
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
            {projects.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 text-sm">
                    暂无项目，点击上方 "新建项目" 开始创作
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Projects;