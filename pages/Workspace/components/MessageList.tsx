import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from '../../../types';
import { AgentMessage } from './AgentMessage';
import { useAgentStore } from '../../../stores/agent.store';
import { TaskProgress } from '../../../components/agents/TaskProgress';

const SmartMessageRenderer = ({ text, onGenerate, onAction }: { text: string; onGenerate: (prompt: string) => void; onAction?: (action: string) => void }) => {
    const cleanText = text.replace(/---AGENT_IMAGES---[\s\S]*$/m, '').trim();
    if (!cleanText) return <div className="whitespace-pre-wrap">{text}</div>;
    return <div className="whitespace-pre-wrap">{cleanText}</div>;
};

interface MessageListProps {
    onSend: (text: string) => void;
    onSmartGenerate: (prompt: string) => void;
    onPreview: (url: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ onSend, onSmartGenerate, onPreview }) => {
    const messages = useAgentStore(s => s.messages);
    const isTyping = useAgentStore(s => s.isTyping);
    const currentTask = useAgentStore(s => s.currentTask);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="space-y-4 pb-4">
            {messages.map(msg => (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {msg.role === 'user' ? (
                        msg.skillData ? (
                            <div className="max-w-[85%] rounded-[20px] rounded-tr-sm px-3 py-2 text-[13px] bg-gray-100 text-gray-800 flex flex-col gap-2 relative overflow-hidden group transition">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{msg.skillData.name}</span>
                                </div>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className={`grid gap-1.5 ${msg.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                        {msg.attachments.map((att, i) => (
                                            <img key={i} src={att} className="rounded-lg border border-gray-100 object-cover object-center w-full max-h-20" />
                                        ))}
                                    </div>
                                )}
                                <div className="text-xs text-gray-400 bg-gray-50 px-2.5 py-2 rounded-xl border border-gray-100/50 whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title={msg.text}>
                                    {msg.text}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-[85%] rounded-2xl rounded-tr-none px-4 py-2.5 text-[14px] shadow-sm bg-blue-600 text-white leading-relaxed">
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {msg.attachments.map((att, i) => (
                                            <img key={i} src={att} className="rounded-lg border border-white/20" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <AgentMessage 
                            message={msg} 
                            onPreview={onPreview} 
                            onAction={onSend} 
                        />
                    )}
                </motion.div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
