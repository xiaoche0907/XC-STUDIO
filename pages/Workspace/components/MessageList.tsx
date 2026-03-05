import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ChatMessage } from '../../../types';
import { AgentMessage } from './AgentMessage';
import { useAgentStore } from '../../../stores/agent.store';
import { TaskProgress } from '../../../components/agents/TaskProgress';
import { MessageAttachments } from './MessageAttachments';
import type { Requirements, ModelGenOptions } from '../../../types/workflow.types';

interface MessageListProps {
    onSend: (text: string) => void;
    onSmartGenerate: (prompt: string, proposalId?: string) => void;
    onPreview: (url: string) => void;
    onClothingSubmitRequirements?: (data: Requirements) => void;
    onClothingGenerateModel?: (data: ModelGenOptions) => void;
    onClothingPickModelCandidate?: (url: string) => void;
    onClothingInsertToCanvas?: (url: string, label?: string) => void;
    onClothingRetryFailed?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
    onSend,
    onSmartGenerate,
    onPreview,
    onClothingSubmitRequirements,
    onClothingGenerateModel,
    onClothingPickModelCandidate,
    onClothingInsertToCanvas,
    onClothingRetryFailed,
}) => {
    const messages = useAgentStore(s => s.messages);
    const isTyping = useAgentStore(s => s.isTyping);
    const currentTask = useAgentStore(s => s.currentTask);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentTask?.progressMessage]);

    return (
        <div className="space-y-4 pb-4 px-2 md:px-3">
            {messages.map(msg => (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {msg.role === 'user' ? (
                        msg.skillData ? (
                            <div className="w-full max-w-[95%] xl:max-w-[90%] rounded-3xl rounded-br-md border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-800 shadow-sm flex flex-col gap-2 overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{msg.skillData.name}</span>
                                </div>
                                <MessageAttachments attachments={msg.attachments} onPreview={onPreview} />
                                <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap break-words" title={msg.text}>
                                    {msg.text}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-[95%] xl:max-w-[90%] rounded-2xl bg-gray-100 px-4 py-3 flex flex-col gap-2 overflow-hidden">
                                <MessageAttachments attachments={msg.attachments} onPreview={onPreview} />
                                <div className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{msg.text}</div>
                            </div>
                        )
                    ) : msg.error ? (
                        <div className="max-w-[90%] rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 whitespace-pre-wrap break-words">
                            {msg.text}
                        </div>
                    ) : (
                        <AgentMessage
                            message={msg}
                            onPreview={onPreview}
                            onAction={onSend}
                            onSmartGenerate={onSmartGenerate}
                            onClothingSubmitRequirements={onClothingSubmitRequirements}
                            onClothingGenerateModel={onClothingGenerateModel}
                            onClothingPickModelCandidate={onClothingPickModelCandidate}
                            onClothingInsertToCanvas={onClothingInsertToCanvas}
                            onClothingRetryFailed={onClothingRetryFailed}
                        />
                    )}
                </motion.div>
            ))}
            {isTyping && (
                <div className="flex justify-start mb-6 mt-2 ml-1">
                    <div className="flex items-center gap-3">
                        {/* 拟物风格 Logo 图标 */}
                        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                            <Sparkles size={14} className="text-white fill-white/20 animate-pulse" />
                        </div>
                        {/* 立体文案反馈 */}
                        <div className="flex items-center gap-2 pr-4">
                            <span className="text-[13px] text-gray-400 font-medium tracking-wide">思考中...</span>
                            <div className="flex items-center gap-1 opacity-40">
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ animationDelay: '0s' }}></span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {currentTask && (currentTask.status === 'analyzing' || currentTask.status === 'executing') && (
                <TaskProgress task={currentTask} />
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};
