import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AgentTask, TaskStatus } from '../../types/agent.types';
import { AgentAvatar } from './AgentAvatar';

interface TaskProgressProps {
  task: AgentTask;
}

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: '#888', label: '等待中' },
  analyzing: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: '#3b82f6', label: '分析需求中...' },
  executing: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: '#8b5cf6', label: '生成图片中...' },
  completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: '#10b981', label: '已完成' },
  failed: { icon: <XCircle className="w-4 h-4" />, color: '#ef4444', label: '生成失败' }
};

export const TaskProgress: React.FC<TaskProgressProps> = ({ task }) => {
  const config = statusConfig[task.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10"
    >
      <AgentAvatar agentId={task.agentId} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: task.status === 'analyzing' || task.status === 'executing' ? 360 : 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ color: config.color }}
          >
            {config.icon}
          </motion.div>
          <span className="text-sm font-medium" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
        <p className="text-xs text-white/60 truncate mt-1">
          {task.input.message}
        </p>
      </div>

      {(task.status === 'analyzing' || task.status === 'executing') && (
        <motion.div
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: config.color }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};
