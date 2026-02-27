import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDown, ChevronUp, Search, Eye, Sparkles, 
    ThumbsUp, ThumbsDown, Copy, Check 
} from 'lucide-react';
import { ChatMessage } from '../../../types';

interface AgentMessageProps {
    message: ChatMessage;
    onPreview: (url: string) => void;
    onAction?: (action: string) => void;
}

export const AgentMessage: React.FC<AgentMessageProps> = ({ message, onPreview, onAction }) => {
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const hasAgentData = !!message.agentData;
    const agentData = message.agentData;

    return (
        <div className="w-full group">
            {/* 日期头部 - 仅在有代理数据或作为独立回复时显示 */}
            <div className="flex justify-start mb-2 px-1">
                <span className="text-[11px] text-gray-400 font-medium">
                    {new Date(message.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>

            <div className="flex flex-col gap-3 max-w-[95%]">
                {/* 1. 引导文字 */}
                <div className="text-[14px] text-gray-800 leading-relaxed font-normal px-1">
                    {message.text}
                </div>

                {/* 2. 可折叠分析区 */}
                {agentData?.analysis && (
                    <div className="px-1">
                        <button 
                            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100/60 hover:bg-gray-100 rounded-xl transition-all border border-gray-100/50 group/btn"
                        >
                            <Search size={14} className="text-gray-500 group-hover/btn:text-gray-800 transition-colors" />
                            <span className="text-[13px] font-medium text-gray-600 group-hover/btn:text-gray-900 transition-colors">
                                图片分析
                            </span>
                            {isAnalysisExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </button>
                        
                        <AnimatePresence>
                            {isAnalysisExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {agentData.analysis}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* 3. 中间提示文字（如果有） */}
                {agentData?.description && (
                    <div className="text-[13px] text-gray-700 leading-relaxed px-1">
                        {agentData.description}
                    </div>
                )}

                {/* 4. 模型标签区 (居中风格) */}
                {agentData?.model && (
                    <div className="flex items-center gap-1.5 justify-start px-1 mt-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Eye size={14} strokeWidth={2.5} />
                            <span className="text-[11px] font-semibold tracking-tight uppercase opacity-60">
                                {agentData.model}
                            </span>
                        </div>
                    </div>
                )}

                {/* 5. 结果展示区 (图片/视频) */}
                {agentData?.imageUrls && agentData.imageUrls.length > 0 && (
                    <div className="px-1">
                        {agentData.imageUrls.length === 1 ? (
                            <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 aspect-auto min-h-[100px]">
                                <img 
                                    src={agentData.imageUrls[0]} 
                                    alt="Generated"
                                    className="w-full h-auto object-contain cursor-zoom-in hover:opacity-95 transition"
                                    onClick={() => onPreview(agentData.imageUrls![0])}
                                />
                                {/* 生成中状态占位符？暂时合并在 imageUrls 中 */}
                            </div>
                        ) : (
                            <div className={`grid gap-2 ${agentData.imageUrls.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                {agentData.imageUrls.map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                        <img 
                                            src={url} 
                                            className="w-full h-full object-cover cursor-zoom-in hover:opacity-95 transition"
                                            onClick={() => onPreview(url)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 6. 底部完成文字 */}
                {agentData?.title && (
                   <div className="text-[13px] text-gray-800 leading-relaxed font-normal px-1">
                       {agentData.title}
                   </div>
                )}

                {/* 7. 交互操作栏 */}
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors">
                        <ThumbsUp size={14} />
                    </button>
                    <button className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors">
                        <ThumbsDown size={14} />
                    </button>
                    <button 
                        onClick={handleCopy}
                        className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors relative"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
