import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Key, X, Check, Eye, EyeOff, Loader2, Link as LinkIcon, 
  Shield, Sliders, HardDrive, Info, Globe, Banana, Zap, 
  Bot, Search, RefreshCw, ChevronDown, ChevronUp, 
  FileText, Image as ImageIcon, Video, Plus, Box, ArrowLeft 
} from 'lucide-react';
import { SettingsCard } from '../components/Settings/SettingsCard';
import { SettingsControl, SettingsToggle, SettingsInput, SettingsSelect } from '../components/Settings/SettingsControl';
import { fetchAvailableModels } from '../services/gemini';
import Sidebar from '../components/Sidebar';

type ApiProvider = 'gemini' | 'yunwu' | 'custom';
type SettingsTab = 'api' | 'mapping' | 'advanced' | 'storage' | 'about';

interface ModelInfo {
    id: string;
    name: string;
    brand?: 'Google' | 'OpenAI' | 'Anthropic' | 'DeepSeek' | 'Volcengine' | 'Bailian' | 'ChatGLM' | 'Wenxin' | 'Minimax' | 'Grok' | 'Moonshot' | 'Flux' | 'Ideogram' | 'Fal' | 'Replicate' | 'Midjourney' | 'Other'; /* cspell:disable-line */
    category: 'script' | 'image' | 'video';
    provider?: string;
}

interface ApiProviderConfig {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    isCustom?: boolean;
}

const RECOMMENDED_MODELS = {
    script: [
        { id: 'gpt-4o', name: 'GPT-4o', brand: 'OpenAI' },
        { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', brand: 'Anthropic' },
        { id: 'deepseek-chat', name: 'DeepSeek-V3', brand: 'DeepSeek' }, /* cspell:disable-line */
        { id: 'deepseek-reasoner', name: 'DeepSeek-R1', brand: 'DeepSeek' }, /* cspell:disable-line */
        { id: 'doubao-pro-32k', name: '豆包 Pro (火山)', brand: 'Volcengine' }, /* cspell:disable-line */
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', brand: 'Google' },
    ],
    image: [
        { id: 'dall-e-3', name: 'DALL-E 3', brand: 'OpenAI' },
        { id: 'flux-1.1-pro', name: 'FLUX 1.1 Pro', brand: 'Flux' },
        { id: 'flux-pro', name: 'FLUX Pro', brand: 'Flux' },
        { id: 'ideogram-v2', name: 'Ideogram v2', brand: 'Ideogram' },
        { id: 'doubao-vision', name: '豆包 视界 (火山)', brand: 'Volcengine' }, /* cspell:disable-line */
        { id: 'imagen-3', name: 'Imagen 3', brand: 'Google' }, /* cspell:disable-line */
    ],
    video: [
        { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast', brand: 'Google' },
        { id: 'veo-3.1-generate-preview', name: 'Veo 3.1 Pro', brand: 'Google' },
        { id: 'kling-v1-5', name: 'Kling 1.5', brand: 'Other' },
        { id: 'hailuo-video-v1', name: 'Hailuo Video', brand: 'Other' }, /* cspell:disable-line */
    ]
};

const PROVIDER_ICONS: { id: ModelInfo['brand'] | string; name: string; icon: string }[] = [
    { id: 'deepseek', name: 'DeepSeek', icon: '/icons/deepseek.svg' }, /* cspell:disable-line */
    { id: 'openai', name: 'OpenAI', icon: '/icons/openai.svg' },
    { id: 'anthropic', name: 'Anthropic', icon: '/icons/anthropic.svg' },
    { id: 'volcengine', name: '火山引擎', icon: '/icons/volc.svg' }, /* cspell:disable-line */
    { id: 'bailian', name: '阿里百炼', icon: '/icons/alibailian.svg' }, /* cspell:disable-line */
    { id: 'chatglm', name: '智谱清言', icon: '/icons/chatglm.svg' }, /* cspell:disable-line */
    { id: 'wenxin', name: '百度文心', icon: '/icons/wenxin.svg' }, /* cspell:disable-line */
    { id: 'minimax', name: '海螺 MiniMax', icon: '/icons/minimax.svg' },
    { id: 'gemini', name: 'Google Node', icon: '/icons/gemini.svg' },
    { id: 'imagen', name: 'Imagen Node', icon: '/icons/imagen.svg' }, /* cspell:disable-line */
    { id: 'flux', name: 'Flux AI Node', icon: '/icons/flux.svg' },
    { id: 'ideogram', name: 'Ideogram Node', icon: '/icons/ideogram.svg' },
    { id: 'fal', name: 'Fal AI Node', icon: '/icons/fal.svg' },
    { id: 'hailuo', name: 'Hailuo Node', icon: '/icons/hailuo.svg' }, /* cspell:disable-line */
    { id: 'replicate', name: 'Replicate Node', icon: '/icons/replicate.svg' },
    { id: 'midjourney', name: 'Midjourney Node', icon: '/icons/midjourney.svg' },
];

const ModelCard = React.memo(({
    model,
    isSelected,
    onToggle,
    providerName
}: {
    model: ModelInfo;
    isSelected: boolean;
    onToggle: () => void;
    providerName: string;
}) => (
    <div
        onClick={onToggle}
        className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${isSelected
            ? 'bg-blue-50/50 border-blue-600 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-300'
            }`}
    >
        <div className="flex items-center gap-5">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                ? 'bg-blue-600 border-blue-600' : 'border-gray-200'
                }`}>
                {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
            </div>
            <div>
                <div className="text-sm font-black text-gray-800 tracking-tight truncate max-w-[180px]">{model.id}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{model.brand || 'Other'} Node</div>
            </div>
        </div>
        <div className="text-[10px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
            {providerName}
        </div>
    </div>
));

ModelCard.displayName = 'ModelCard';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('api');
    const [providers, setProviders] = useState<ApiProviderConfig[]>([
        { id: 'gemini', name: 'Gemini (原生)', baseUrl: 'https://generativelanguage.googleapis.com', apiKey: '' },
        { id: 'yunwu', name: '云雾 (OpenAI)', baseUrl: 'https://yunwu.ai', apiKey: '' }
    ]);
    const [activeProviderId, setActiveProviderId] = useState('gemini');

    const [replicateKey, setReplicateKey] = useState('');
    const [klingKey, setKlingKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    // Service Mapping State
    const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [brandFilter, setBrandFilter] = useState<string>('all');

    const [selectedScriptModels, setSelectedScriptModels] = useState<string[]>([]);
    const [selectedImageModels, setSelectedImageModels] = useState<string[]>([]);
    const [selectedVideoModels, setSelectedVideoModels] = useState<string[]>([]);

    const [expandedCategory, setExpandedCategory] = useState<string | null>('image');
    const [visibleCount, setVisibleCount] = useState(60);

    // Advanced Settings
    const [visualContinuity, setVisualContinuity] = useState(true);
    const [systemModeration, setSystemModeration] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [concurrentCount, setConcurrentCount] = useState(1);

    // Editing state
    const [editingProvider, setEditingProvider] = useState<ApiProviderConfig | null>(null);

    useEffect(() => {
        const savedProviders = localStorage.getItem('api_providers');
        if (savedProviders) {
            try {
                setProviders(JSON.parse(savedProviders));
            } catch (e) {
                console.error("Parse error", e);
            }
        } else {
            const geminiKey = localStorage.getItem('gemini_api_key') || '';
            const yunwuKey = localStorage.getItem('yunwu_api_key') || '';
            setProviders([
                { id: 'gemini', name: 'Gemini (原生)', baseUrl: 'https://generativelanguage.googleapis.com', apiKey: geminiKey },
                { id: 'yunwu', name: '云雾 (OpenAI)', baseUrl: 'https://yunwu.ai', apiKey: yunwuKey }
            ]);
        }

        setActiveProviderId(localStorage.getItem('api_provider') || 'gemini');
        setReplicateKey(localStorage.getItem('replicate_api_key') || '');
        setKlingKey(localStorage.getItem('kling_api_key') || '');

        setSelectedScriptModels(JSON.parse(localStorage.getItem('setting_script_models') || '["gemini-1.5-flash"]'));
        setSelectedImageModels(JSON.parse(localStorage.getItem('setting_image_models') || '["gemini-1.5-flash-image-preview"]'));
        setSelectedVideoModels(JSON.parse(localStorage.getItem('setting_video_models') || '["veo-3.1-fast"]'));

        setVisualContinuity(localStorage.getItem('setting_visual_continuity') !== 'false');
        setSystemModeration(localStorage.getItem('setting_system_moderation') === 'true');
        setAutoSave(localStorage.getItem('setting_auto_save') !== 'false');
        setConcurrentCount(parseInt(localStorage.getItem('setting_concurrent_count') || '1', 10));

        setSaveStatus('idle');
    }, []);

    const activeProvider = providers.find(p => p.id === activeProviderId) || providers[0];

    useEffect(() => {
        if (activeProviderId) {
            handleRefreshModels(activeProviderId);
        }
    }, [activeProviderId]);

    const handleRefreshModels = async (providerId: string) => {
        setIsLoadingModels(true);
        const p = providers.find(p => p.id === providerId);
        if (!p) {
            setIsLoadingModels(false);
            return;
        }

        const keys = p.apiKey.split('\n').map(k => k.trim()).filter(Boolean);
        if (keys.length === 0) {
            setAvailableModels([]);
            setIsLoadingModels(false);
            return;
        }

        const models = await fetchAvailableModels(providerId, keys, p.baseUrl);

        const formattedModels = (models || []).map((id: string) => {
            let brand: ModelInfo['brand'] = 'Other';
            const lowerId = id.toLowerCase();
            if (lowerId.includes('gemini') || lowerId.includes('goog') || lowerId.includes('veo') || lowerId.includes('imagen')) brand = 'Google'; /* cspell:disable-line */
            else if (lowerId.includes('gpt') || lowerId.includes('o1-') || lowerId.includes('o3-')) brand = 'OpenAI';
            else if (lowerId.includes('claude')) brand = 'Anthropic';
            else if (lowerId.includes('deepseek')) brand = 'DeepSeek'; /* cspell:disable-line */
            else if (lowerId.includes('doubao') || lowerId.includes('volc')) brand = 'Volcengine'; /* cspell:disable-line */
            else if (lowerId.includes('qw')) brand = 'Bailian'; /* cspell:disable-line */
            else if (lowerId.includes('glm')) brand = 'ChatGLM';
            else if (lowerId.includes('ernie')) brand = 'Wenxin'; /* cspell:disable-line */
            else if (lowerId.includes('grok')) brand = 'Grok';
            else if (lowerId.includes('moonshot')) brand = 'Moonshot';
            else if (lowerId.includes('flux')) brand = 'Flux';
            else if (lowerId.includes('ideogram')) brand = 'Ideogram';
            else if (lowerId.includes('fal')) brand = 'Fal';
            else if (lowerId.includes('replicate')) brand = 'Replicate';
            else if (lowerId.includes('midjourney')) brand = 'Midjourney';

            let category: 'script' | 'image' | 'video' = 'script';
            if (lowerId.includes('vision') || lowerId.includes('dall-e') || lowerId.includes('flux') || lowerId.includes('imagen') || lowerId.includes('image') || lowerId.includes('stable-diffusion') || lowerId.includes('midjourney') || lowerId.includes('sdxl') || lowerId.includes('ideogram') || lowerId.includes('kolors') || lowerId.includes('playground') || lowerId.includes('aura') || lowerId.includes('recraft')) category = 'image'; /* cspell:disable-line */
            else if (lowerId.includes('video') || lowerId.includes('kling') || lowerId.includes('hailuo') || lowerId.includes('veo') || lowerId.includes('luma') || lowerId.includes('sora') || lowerId.includes('pika') || lowerId.includes('gen-2') || lowerId.includes('gen-3') || lowerId.includes('animate') || lowerId.includes('movie')) category = 'video'; /* cspell:disable-line */

            return { id, name: id, brand, category, provider: p.name };
        });

        setAvailableModels(formattedModels);
        setIsLoadingModels(false);
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            localStorage.setItem('api_providers', JSON.stringify(providers));
            localStorage.setItem('api_provider', activeProviderId);
            localStorage.setItem('replicate_api_key', replicateKey.trim());
            localStorage.setItem('kling_api_key', klingKey.trim());

            localStorage.setItem('setting_script_models', JSON.stringify(selectedScriptModels));
            localStorage.setItem('setting_image_models', JSON.stringify(selectedImageModels));
            localStorage.setItem('setting_video_models', JSON.stringify(selectedVideoModels));

            localStorage.setItem('setting_visual_continuity', visualContinuity ? 'true' : 'false');
            localStorage.setItem('setting_system_moderation', systemModeration ? 'true' : 'false');
            localStorage.setItem('setting_auto_save', autoSave ? 'true' : 'false');
            localStorage.setItem('setting_concurrent_count', concurrentCount.toString());

            setIsSaving(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 600);
    };

    const deleteProvider = (id: string) => {
        if (!window.confirm('确定要删除此节点吗？')) return;
        setProviders(prev => prev.filter(p => p.id !== id));
        if (activeProviderId === id) setActiveProviderId('');
    };

    const filteredModels = useMemo(() => {
        return availableModels.filter(m => {
            if (m.id.toLowerCase().includes('embedding')) return false;
            const matchesCategory = m.category === expandedCategory;
            const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBrand = brandFilter === 'all' || m.brand?.toLowerCase() === brandFilter.toLowerCase();
            return matchesCategory && matchesSearch && matchesBrand;
        });
    }, [availableModels, searchQuery, brandFilter, expandedCategory]);

    useEffect(() => {
        setVisibleCount(60);
    }, [searchQuery, brandFilter, availableModels]);

    const tabs: { id: SettingsTab; label: string; icon: any }[] = [
        { id: 'api', label: '服务商配置', icon: Key },
        { id: 'mapping', label: '模型映射', icon: Globe },
        { id: 'advanced', label: '交互设置', icon: Sliders },
        { id: 'storage', label: '缓存磁盘', icon: HardDrive },
        { id: 'about', label: '系统架构', icon: Info },
    ];

    const toggleModel = (category: 'script' | 'image' | 'video', modelId: string) => {
        if (category === 'script') {
            setSelectedScriptModels(prev => prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]);
        } else if (category === 'image') {
            setSelectedImageModels(prev => prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]);
        } else if (category === 'video') {
            setSelectedVideoModels(prev => prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f8f9fb]">
            <Sidebar />
            
            <div className="flex-1 flex flex-col ml-24 mr-6 my-6 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-white overflow-hidden">
                <header className="px-10 py-8 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h3 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                            设置中心
                            <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-bold">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-8 py-2.5 rounded-xl text-sm font-black text-white shadow-xl transition-all duration-300 active:scale-95 flex items-center gap-3 ${saveStatus === 'success'
                                ? 'bg-green-500 shadow-green-500/20'
                                : 'bg-black shadow-black/20 hover:bg-gray-800'
                                }`}
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : saveStatus === 'success' ? <Check size={16} /> : <RefreshCw size={16} />}
                            <span>{saveStatus === 'success' ? '已入库' : '保存设置'}</span>
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Inner Sidebar */}
                    <div className="w-64 bg-gray-50/50 border-r border-gray-100 p-6 flex flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                                    : 'text-gray-400 hover:bg-white hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                                <span className="text-xs font-black uppercase tracking-wider">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar pb-24">
                        {activeTab === 'api' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900">API 供应商</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Infrastructure Management</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newP: ApiProviderConfig = {
                                                id: `custom_${Date.now()}`,
                                                name: '新服务商',
                                                baseUrl: '',
                                                apiKey: '',
                                                isCustom: true
                                            };
                                            setEditingProvider(newP);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-blue-600 hover:border-blue-400 transition-all shadow-sm"
                                    >
                                        <Plus size={14} />
                                        添加节点
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {providers.map(p => (
                                        <div
                                            key={p.id}
                                            className={`bg-white border rounded-3xl p-6 transition-all flex items-center justify-between ${activeProviderId === p.id ? 'border-black ring-4 ring-black/5 shadow-lg' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${activeProviderId === p.id ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}>
                                                    {p.id === 'gemini' ? <Zap size={20} /> : <Globe size={20} />}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-gray-900 leading-none mb-1">{p.name}</h5>
                                                    <div className="text-[10px] text-gray-400 font-bold truncate max-w-[200px]">{p.baseUrl || 'Default Endpoint'}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setEditingProvider({ ...p })}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-black transition-all"
                                                >
                                                    <Sliders size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setActiveProviderId(p.id)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeProviderId === p.id ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:text-black'}`}
                                                >
                                                    {activeProviderId === p.id ? '当前使用' : '切换节点'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-6 mt-8">
                                    <SettingsCard title="交互增强" icon={<Zap size={18} />} description="全局生成设置">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mt-4">
                                            <div>
                                                <div className="text-xs font-black text-gray-800">并行任务数</div>
                                                <div className="text-[10px] text-gray-400 font-bold">建议设置 1-3</div>
                                            </div>
                                            <input
                                                type="number"
                                                value={concurrentCount}
                                                onChange={e => setConcurrentCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-16 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-bold text-center outline-none"
                                            />
                                        </div>
                                    </SettingsCard>
                                    
                                    <div className="space-y-4">
                                        <SettingsCard title="三方集成" icon={<Plus size={18} />}>
                                            <div className="space-y-3 mt-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Replicate Key</label>
                                                    <SettingsInput type="password" value={replicateKey} onChange={e => setReplicateKey(e.target.value)} placeholder="r8_..." />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Kling Key</label>
                                                    <SettingsInput type="password" value={klingKey} onChange={e => setKlingKey(e.target.value)} placeholder="kling-..." />
                                                </div>
                                            </div>
                                        </SettingsCard>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'mapping' && (
                            <div className="space-y-6">
                                {(['script', 'image', 'video'] as const).map(cat => (
                                    <div key={cat} className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
                                        <button
                                            onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                                            className={`w-full px-8 py-6 flex items-center justify-between text-left transition-all ${expandedCategory === cat ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`p-3 rounded-2xl ${cat === 'script' ? 'bg-purple-50 text-purple-600' : cat === 'image' ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
                                                    {cat === 'script' ? <Bot size={20} /> : cat === 'image' ? <ImageIcon size={20} /> : <Video size={20} />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900">{cat === 'script' ? '智能体思考' : cat === 'image' ? '视觉创作' : '动态视频'}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">已选 {(cat === 'script' ? selectedScriptModels : cat === 'image' ? selectedImageModels : selectedVideoModels).length} 个适配模型</p>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                {expandedCategory === cat ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {expandedCategory === cat && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                    <div className="p-8 border-t border-gray-50 bg-[#fafafa]">
                                                        {/* Filters and Selection logic - similar to Modal but layout optimized */}
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <div className="relative flex-1">
                                                                <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                <input
                                                                    value={searchQuery}
                                                                    onChange={e => setSearchQuery(e.target.value)}
                                                                    placeholder="搜索引擎..."
                                                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[400px]">
                                                                {['all', 'OpenAI', 'Google', 'DeepSeek', 'Flux', 'Ideogram'].map(b => (
                                                                    <button
                                                                        key={b}
                                                                        onClick={() => setBrandFilter(b)}
                                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${brandFilter === b ? 'bg-black text-white' : 'bg-white text-gray-400 hover:text-black'}`}
                                                                    >
                                                                        {b === 'all' ? '全部' : b}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                                            {filteredModels.slice(0, visibleCount).map(m => (
                                                                <ModelCard
                                                                    key={m.id}
                                                                    model={m}
                                                                    isSelected={(cat === 'script' ? selectedScriptModels : cat === 'image' ? selectedImageModels : selectedVideoModels).includes(m.id)}
                                                                    onToggle={() => toggleModel(cat, m.id)}
                                                                    providerName={activeProvider.name}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="max-w-3xl space-y-6">
                                <SettingsCard title="体验优化" icon={<Zap size={18} />}>
                                    <div className="space-y-2 mt-4">
                                        <SettingsControl label="视觉一致性" description="智能体在多个生成步骤间保持视觉特征。">
                                            <SettingsToggle active={visualContinuity} onClick={() => setVisualContinuity(!visualContinuity)} />
                                        </SettingsControl>
                                        <SettingsControl label="安全过滤" description="启用系统内置的合规性预警流程。">
                                            <SettingsToggle active={systemModeration} onClick={() => setSystemModeration(!systemModeration)} />
                                        </SettingsControl>
                                        <SettingsControl label="自动保存" description="工作进度的后台即时备份（每 5 分钟）。">
                                            <SettingsToggle active={autoSave} onClick={() => setAutoSave(!autoSave)} />
                                        </SettingsControl>
                                    </div>
                                </SettingsCard>
                            </div>
                        )}

                        {activeTab === 'storage' && (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                                <HardDrive size={48} className="text-gray-300 mb-6" />
                                <h4 className="text-lg font-black text-gray-900 mb-2">架构节点加载中</h4>
                                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">当前版本 XC-Studio 仅支持本地存储，云端同步模块正在进行内测（预计 V5.0 加入）。</p>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-10">
                                <div className="bg-gradient-to-br from-black to-gray-800 p-16 rounded-[3rem] text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h4 className="text-6xl font-black mb-4 tracking-tighter">XC-STUDIO</h4>
                                        <p className="text-blue-400 text-sm font-bold uppercase tracking-[0.4em] mb-12">System Architecture Engine V4.2.0</p>
                                        <div className="flex gap-4">
                                            <div className="px-6 py-2.5 bg-white/10 rounded-2xl text-[10px] font-black backdrop-blur-md">PRODUCTION STABLE</div>
                                            <div className="px-6 py-2.5 bg-blue-600 rounded-2xl text-[10px] font-black shadow-lg shadow-blue-500/20">AGENT CORE UPGRADED</div>
                                        </div>
                                    </div>
                                    <Zap size={280} className="absolute -right-12 -bottom-12 opacity-10 rotate-12 text-white fill-white" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-8">
                                    <SettingsCard title="关于系统" icon={<Info size={18} />}>
                                        <div className="mt-4 space-y-4">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400 font-bold uppercase tracking-wider">内核版本</span>
                                                <span className="font-mono font-black text-blue-600">v4.2.1-SR2</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400 font-bold uppercase tracking-wider">开发代号</span>
                                                <span className="font-black">Antigravity</span>
                                            </div>
                                        </div>
                                    </SettingsCard>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Provider Edit Overlay */}
            <AnimatePresence>
                {editingProvider && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative border border-white"
                        >
                            <button 
                                onClick={() => setEditingProvider(null)}
                                className="absolute right-8 top-8 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>

                            <h4 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                                    <Plus size={20} />
                                </div>
                                {editingProvider.isCustom ? '配置新节点' : '编辑节点参数'}
                            </h4>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">节点名称</label>
                                    <SettingsInput 
                                        value={editingProvider.name} 
                                        onChange={e => setEditingProvider({ ...editingProvider, name: e.target.value })} 
                                        placeholder="例如：Gemini 代理" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">API 端点 (Base URL)</label>
                                    <SettingsInput 
                                        value={editingProvider.baseUrl} 
                                        onChange={e => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })} 
                                        placeholder="https://..." 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">API 密钥 (支持多行轮询)</label>
                                    <textarea
                                        value={editingProvider.apiKey}
                                        onChange={e => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                                        placeholder="粘贴 API Key，每行一个"
                                        className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button
                                    onClick={() => setEditingProvider(null)}
                                    className="flex-1 py-4 bg-gray-50 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-widest"
                                >
                                    放弃
                                </button>
                                <button
                                    onClick={() => {
                                        setProviders(prev => {
                                            const idx = prev.findIndex(p => p.id === editingProvider.id);
                                            if (idx > -1) {
                                                const next = [...prev];
                                                next[idx] = editingProvider;
                                                return next;
                                            }
                                            return [...prev, editingProvider];
                                        });
                                        setEditingProvider(null);
                                    }}
                                    className="flex-1 py-4 bg-black rounded-2xl text-xs font-black text-white shadow-xl shadow-black/20 hover:-translate-y-1 transition-all uppercase tracking-widest"
                                >
                                    确认部署
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;
