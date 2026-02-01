import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X, Check, Eye, EyeOff, Loader2, Link as LinkIcon } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { createPortal } from 'react-dom';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    useEffect(() => {
        if (isOpen) {
            const currentKey = localStorage.getItem('custom_api_key') || '';
            const currentUrl = localStorage.getItem('custom_api_url') || '';
            setApiKey(currentKey);
            setApiUrl(currentUrl);
            setSaveStatus('idle');
        }
    }, [isOpen]);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate a brief validation/save process
        setTimeout(() => {
            localStorage.setItem('custom_api_key', apiKey);
            if (apiUrl.trim()) {
                localStorage.setItem('custom_api_url', apiUrl.trim());
            } else {
                localStorage.removeItem('custom_api_url');
            }
            
            setIsSaving(false);
            setSaveStatus('success');
            setTimeout(() => {
                onClose();
            }, 800);
        }, 600);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                    />
                    
                    {/* Modal */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white pointer-events-auto w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                        <Key size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">API 配置</h2>
                                        <p className="text-xs text-gray-400">设置您的 Google Gemini API Key</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 block">API Key</label>
                                    <div className="relative group">
                                        <input 
                                            type={isVisible ? "text" : "password"} 
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="sk-..." 
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-mono text-sm pr-10 hover:border-gray-300"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={() => setIsVisible(!isVisible)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                                        >
                                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        我们需要这个密钥来调用 Gemini 模型。它将仅存储在您的本地浏览器中，绝不会发送到我们的服务器。
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 block flex items-center gap-2">
                                        API Proxy URL
                                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>
                                    </label>
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            value={apiUrl}
                                            onChange={(e) => setApiUrl(e.target.value)}
                                            placeholder="https://generativelanguage.googleapis.com" 
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-mono text-sm pr-10 hover:border-gray-300"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                                            <LinkIcon size={16} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        如果您使用的是中转/代理 API，请在此处输入完整的基础 URL（例如：https://api.openai-proxy.com/google）。
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                                <button 
                                    onClick={onClose}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                                >
                                    取消
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={!apiKey.trim() || isSaving}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all active:scale-95 ${
                                        saveStatus === 'success' ? 'bg-green-500 border-green-500' : 'bg-black hover:bg-gray-900 border-transparent'
                                    }`}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>验证中...</span>
                                        </>
                                    ) : saveStatus === 'success' ? (
                                        <>
                                            <Check size={16} />
                                            <span>已保存</span>
                                        </>
                                    ) : (
                                        <span>保存配置</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
