import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AgentTask, TaskStatus } from '../../types/agent.types';

interface TaskProgressProps {
  task: AgentTask;
}

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock size={12} />, color: '#94a3b8', label: '准备中' },
  analyzing: { icon: <Loader2 size={12} className="animate-spin" />, color: '#3b82f6', label: '分析需求' },
  executing: { icon: <Loader2 size={12} className="animate-spin text-purple-500" />, color: '#8b5cf6', label: '模型生成' },
  completed: { icon: <CheckCircle2 size={12} />, color: '#10b981', label: '已完成' },
  failed: { icon: <XCircle size={12} />, color: '#ef4444', label: '失败' }
};

export const TaskProgress: React.FC<TaskProgressProps> = ({ task }) => {
  const [seconds, setSeconds] = React.useState(0);
  
  React.useEffect(() => {
    if (task.status === 'executing' || task.status === 'analyzing') {
      const timer = setInterval(() => setSeconds(s => s + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [task.status]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isGenerating = task.status === 'executing' || task.status === 'analyzing';
  if (!isGenerating) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-between w-full max-w-[400px] py-2 px-1 gap-2"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 grayscale opacity-70">
           <Loader2 size={14} className="animate-spin text-black" strokeWidth={1.5} />
           <span className="text-[12px] font-medium text-gray-600">图片分析...</span>
        </div>
        <div className="h-3 w-[1px] bg-gray-200"></div>
        <div className="flex items-center gap-2">
           <span className="text-[11px] text-gray-400 font-mono">{formatTime(seconds)} / 30秒</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 opacity-60">
        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        <span className="text-[11px] text-gray-500 font-medium">使用 Nano Banana Pro 生成图片...</span>
      </div>
    </motion.div>
  );
};
