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
  const config = statusConfig[task.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-1.5 w-full max-w-[360px] pb-4 px-1"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex-shrink-0" style={{ color: config.color }}>
            {config.icon}
          </div>
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-tight">
            {config.label}
          </span>
          <span className="text-[12px] text-gray-300 font-medium truncate opacity-60">
            {task.input.message}
          </span>
        </div>
      </div>

      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: config.color }}
          initial={{ width: '5%' }}
          animate={{ 
            width: task.status === 'completed' ? '100%' : task.status === 'failed' ? '100%' : task.status === 'executing' ? '80%' : task.status === 'analyzing' ? '40%' : '5%' 
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
};
