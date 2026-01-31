
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Minus, Plus, Share2, Maximize2, X, RotateCw, 
  ArrowUp, Paperclip, Lightbulb, Zap, Globe, Box, Sparkles,
  MousePointer2, Square, Type, PenTool, Image as ImageIcon,
  History, Settings, Layers, Hand, MapPin, Check, Command,
  Video, Hash, Trash2, Undo2, Redo2, FileText,
  Triangle, Star, MessageSquare, ArrowLeft, ArrowRight, Circle as CircleIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold as BoldIcon, Italic, Underline, Strikethrough, 
  Type as TypeIcon, MoreHorizontal, Download, Search, Move,
  ChevronUp, Loader2, ImagePlus, ChevronRight, CornerUpRight, Link2, Link as LinkIcon, Unlink,
  Minimize2, Play, Film, Clock, SquarePen, Folder, PanelRightClose,
  Eraser, Scissors, Shirt, Expand, Crop, MonitorUp, Highlighter,
  Gift, Store, Layout, Copy, Info, MessageSquarePlus, File as FileIcon, CirclePlus,
  Scan, ZoomIn, Scaling
} from 'lucide-react';
import { createChatSession, sendMessage, generateImage, generateVideo, extractTextFromImage, analyzeImageRegion } from '../services/gemini';
import { ChatMessage, Template, CanvasElement, ShapeType, Marker, Project } from '../types';
import { getProject, saveProject, formatDate } from '../services/storage';
import { Content } from '@google/genai';
import { useAgentOrchestrator } from '../hooks/useAgentOrchestrator';
import { useProjectContext } from '../hooks/useProjectContext';
import { getAgentInfo, executeAgentTask } from '../services/agents';
import { AgentAvatar } from '../components/agents/AgentAvatar';
import { AgentSelector } from '../components/agents/AgentSelector';
import { ProposalSelector } from '../components/agents/ProposalSelector';
import { TaskProgress } from '../components/agents/TaskProgress';
import { AgentType, AgentProposal, AgentTask } from '../types/agent.types';

const TEMPLATES: Template[] = [
  { id: '1', title: 'Wine List', description: 'Mimic this effect to generate a poster of ...', image: 'https://picsum.photos/80/80?random=10' },
  { id: '2', title: 'Coffee Shop Branding', description: 'you are a brand design expert, generate ...', image: 'https://picsum.photos/80/80?random=11' },
  { id: '3', title: 'Story Board', description: 'I NEED A STORY BOARD FOR THIS...', image: 'https://picsum.photos/80/80?random=12' },
];

const FONTS = [
  'Inter', 'Anonymous Pro', 'Crimson Text', 'Albert Sans', 
  'Roboto', 'Roboto Mono', 'Source Serif Pro', 'Pacifico',
  'Helvetica', 'Arial', 'Times New Roman'
];

const ASPECT_RATIOS = [
    { label: '21:9', value: '21:9', size: '1568*672' },
    { label: '16:9', value: '16:9', size: '1456*816' },
    { label: '4:3', value: '4:3', size: '1232*928' },
    { label: '3:2', value: '3:2', size: '1344*896' },
    { label: '1:1', value: '1:1', size: '1024*1024' },
    { label: '9:16', value: '9:16', size: '816*1456' },
    { label: '3:4', value: '3:4', size: '928*1232' },
    { label: '2:3', value: '2:3', size: '896*1344' },
    { label: '5:4', value: '5:4', size: '1280*1024' },
    { label: '4:5', value: '4:5', size: '1024*1280' },
];

const VIDEO_RATIOS = [
    { label: '16:9', value: '16:9', icon: 'rectangle-horizontal' },
    { label: '9:16', value: '9:16', icon: 'rectangle-vertical' },
    { label: '1:1', value: '1:1', icon: 'square' },
];

type ToolType = 'select' | 'hand' | 'mark';

// Utility to convert Base64 to File
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const TooltipButton = ({ icon: Icon, label, onClick, active, showTooltipOnHover = true }: { icon: any, label: string, onClick?: () => void, active?: boolean, showTooltipOnHover?: boolean }) => (
  <div className="relative group">
      <button 
          onClick={onClick}
          className={`p-2 rounded-xl transition ${active ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
      >
          <Icon size={18} />
      </button>
      {showTooltipOnHover && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-sm">
            {label}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
  </div>
);

const ShapeMenuItem = ({ icon: Icon, onClick }: { icon: any, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition"
    >
        <Icon size={18} strokeWidth={1.5} />
    </button>
);

interface HistoryState {
  elements: CanvasElement[];
  markers: Marker[];
}

interface InputBlock {
    id: string;
    type: 'text' | 'file';
    text?: string;
    file?: File;
}

const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  
  const [zoom, setZoom] = useState(30);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('未命名');
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<number | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [isLayersCollapsed, setIsLayersCollapsed] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [showHistoryPopover, setShowHistoryPopover] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showRatioPicker, setShowRatioPicker] = useState(false);
  const [showResPicker, setShowResPicker] = useState(false);
  const [showFastEdit, setShowFastEdit] = useState(false);
  const [fastEditPrompt, setFastEditPrompt] = useState('');
  const [history, setHistory] = useState<HistoryState[]>([{ elements: [], markers: [] }]);
  const [historyStep, setHistoryStep] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAssistant, setShowAssistant] = useState(true);
  const [inputBlocks, setInputBlocks] = useState<InputBlock[]>([{ id: 'init', type: 'text', text: '' }]);
  const [activeBlockId, setActiveBlockId] = useState<string>('init');
  const [selectionIndex, setSelectionIndex] = useState<number | null>(null);
  
  // prompt/attachments legacy states replaced by inputBlocks effectively, 
  // but keeping 'prompt' sync for other potential uses if needed, or simply deriving in handleSend.
  // We will ignore 'prompt' and 'attachments' state for the INPUT area.
  const [modelMode, setModelMode] = useState<'thinking' | 'fast'>('thinking');
  const [webEnabled, setWebEnabled] = useState(false);
  const [imageModelEnabled, setImageModelEnabled] = useState(false);
  
  const activeBlockIdRef = useRef(activeBlockId);
  const selectionIndexRef = useRef(selectionIndex);
  
  useEffect(() => { activeBlockIdRef.current = activeBlockId; }, [activeBlockId]);
  useEffect(() => { selectionIndexRef.current = selectionIndex; }, [selectionIndex]);

    // Insert File Logic for Blocks (Moved to top for scope visibility)
    // Uses Refs to ensure event handlers (paste) get current cursor
    const insertInputFile = (file: File) => {
        console.log('insertInputFile called:', file.name, 'Current blocks:', inputBlocks.length, 'Active ID:', activeBlockIdRef.current);
        setInputBlocks(prev => {
            console.log('Prev blocks:', prev.length, 'Block IDs:', prev.map(b => b.id));
            const currentActiveId = activeBlockIdRef.current;
            const currentSelectionIdx = selectionIndexRef.current;
            
            const activeIndex = prev.findIndex(b => b.id === currentActiveId);
            console.log('Active index:', activeIndex, 'Looking for ID:', currentActiveId);
            
            if (activeIndex === -1) {
                console.log('Active block not found! Appending to end.');
                return [...prev, { id: `file-${Date.now()}`, type: 'file', file }, { id: `text-${Date.now()}`, type: 'text', text: '' }];
            }
            
            const activeBlock = prev[activeIndex];
            console.log('Active block found:', activeBlock.type, activeBlock.id);
            
            if (activeBlock.type === 'text') {
                const text = activeBlock.text || '';
                const idx = currentSelectionIdx !== null ? currentSelectionIdx : text.length;
                const preText = text.slice(0, idx);
                const postText = text.slice(idx);
                
                console.log('Splitting text block. Pre:', preText, 'Post:', postText);
                
                const newBlocks: InputBlock[] = [
                    { ...activeBlock, text: preText },
                    { id: `file-${Date.now()}`, type: 'file', file },
                    { id: `text-${Date.now()}`, type: 'text', text: postText }
                ];
                
                console.log('New blocks created:', newBlocks.length, newBlocks.map(b => `${b.type}:${b.id}`));
                
                // Auto-focus the post-text block
                const newBlockId = newBlocks[2].id;
                setTimeout(() => {
                    setActiveBlockId(newBlockId);
                    setSelectionIndex(0); // Start of new block
                    // 直接聚焦 DOM 元素
                    const inputEl = document.getElementById(`input-block-${newBlockId}`) as HTMLInputElement;
                    if (inputEl) {
                        inputEl.focus();
                    }
                }, 50);
                
                const before = prev.slice(0, activeIndex);
                const after = prev.slice(activeIndex + 1);
                const result = [...before, ...newBlocks, ...after];
                console.log('Returning merged blocks:', result.length);
                return result;
            } else {
                console.log('Active block is not text, appending after');
                 return [...prev, { id: `file-${Date.now()}`, type: 'file', file }, { id: `text-${Date.now()}`, type: 'text', text: '' }];
            }
        });
    };
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // New UI states for Assistant
  const [agentMode, setAgentMode] = useState(false);

  // Agent orchestration
  const projectContext = useProjectContext(id || '', projectTitle, elements, messages);
  const { currentTask, isAgentMode, setIsAgentMode, processMessage } = useAgentOrchestrator(projectContext);

  // Sync agentMode state with isAgentMode
  useEffect(() => {
    console.log('[Workspace] Setting isAgentMode to:', agentMode);
    setIsAgentMode(agentMode);
  }, [agentMode, setIsAgentMode]);

  // Text Edit Feature State
  const [showTextEditModal, setShowTextEditModal] = useState(false);
  const [detectedTexts, setDetectedTexts] = useState<string[]>([]);
  const [editedTexts, setEditedTexts] = useState<string[]>([]);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [showFileListModal, setShowFileListModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refImageInputRef = useRef<HTMLInputElement>(null);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeToolMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeShapeMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPromptProcessedRef = useRef(false);

  const saveToHistory = (newElements: CanvasElement[], newMarkers: Marker[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({ elements: newElements, markers: newMarkers });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setElements(history[prevStep].elements);
      setMarkers(history[prevStep].markers);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setElements(history[nextStep].elements);
      setMarkers(history[nextStep].markers);
    }
  };

  useEffect(() => {
    if (!id) return;
    const save = async () => {
        const firstImage = elements.find(el => el.type === 'image' || el.type === 'gen-image');
        const thumbnail = firstImage?.url || '';
        await saveProject({ id, title: projectTitle, updatedAt: formatDate(Date.now()), elements, markers, thumbnail });
    };
    const timeout = setTimeout(save, 1000); 
    return () => clearTimeout(timeout);
  }, [elements, markers, id, projectTitle]);

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    const newElements = elements.map(el => {
        if (el.id === selectedElementId) {
            let updatedEl = { ...el, ...updates };
            if (updates.genAspectRatio && updates.genAspectRatio !== el.genAspectRatio) {
                const [w, h] = updates.genAspectRatio.split(':').map(Number);
                const ratio = w / h;
                updatedEl.height = el.width / ratio;
            }
            if (el.aspectRatioLocked && !updates.genAspectRatio) {
                if (updates.width && !updates.height) {
                    const ratio = el.height / el.width;
                    updates.height = updates.width * ratio;
                } else if (updates.height && !updates.width) {
                    const ratio = el.width / el.height;
                    updates.width = updates.height * ratio;
                }
            }
            return updatedEl;
        }
        return el;
    });
    setElements(newElements);
    saveToHistory(newElements, markers);
  };

  const deleteSelectedElement = () => {
    if (selectedElementId) {
        const newElements = elements.filter(el => el.id !== selectedElementId);
        const newMarkers = markers.filter(m => m.elementId !== selectedElementId);
        setElements(newElements);
        setMarkers(newMarkers);
        setSelectedElementId(null);
        saveToHistory(newElements, newMarkers);
    }
  };

  useEffect(() => {
    setShowFastEdit(false);
    setFastEditPrompt('');
    setShowTextEditModal(false);
  }, [selectedElementId]);

  const fitToScreen = () => {
    if (elements.length === 0) {
        setPan({ x: 0, y: 0 });
        setZoom(100);
        return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 100;
    const containerW = window.innerWidth - (showAssistant ? 400 : 0);
    const containerH = window.innerHeight;
    if (contentWidth <= 0 || contentHeight <= 0) return;
    const zoomW = (containerW - padding * 2) / contentWidth;
    const zoomH = (containerH - padding * 2) / contentHeight;
    const newZoom = Math.min(zoomW, zoomH) * 100;
    const finalZoom = Math.min(Math.max(newZoom, 10), 200);
    const centerX = minX + contentWidth / 2;
    const centerY = minY + contentHeight / 2;
    const newPanX = (containerW / 2) - (centerX * (finalZoom / 100));
    const newPanY = (containerH / 2) - (centerY * (finalZoom / 100));
    setZoom(finalZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleManualPaste = async () => {
      try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
              if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                  const blob = await item.getType(item.types.find(t => t.startsWith('image/'))!);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                      const result = event.target?.result as string;
                      const img = new Image();
                      img.onload = () => {
                          let w = img.width;
                          let h = img.height;
                          const maxDim = 800; // Increased default size
                          if (w > maxDim || h > maxDim) {
                              const ratio = w / h;
                              if (w > h) { w = maxDim; h = maxDim / ratio; }
                              else { h = maxDim; w = maxDim * ratio; }
                          }
                          addElement('image', result, { width: w, height: h });
                      };
                      img.src = result;
                  };
                  reader.readAsDataURL(blob);
              }
          }
      } catch (err) {
          console.error("Clipboard access failed", err);
      }
  };

  const handleDownload = () => {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || !el.url) return;
    const link = document.createElement('a');
    link.href = el.url;
    link.download = `xc-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setContextMenu(null);
  };

  const urlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Conversion failed", e);
        return url;
    }
  };

  // --- Image Processing Handlers ---

  const handleUpscale = async () => {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || !el.url) return;

    const update1 = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: true } : e);
    setElements(update1);

    try {
        const base64Ref = await urlToBase64(el.url);
        // Using "Nano Banana Pro" (gemini-3-pro-image-preview) with 4K size for upscale
        const resultUrl = await generateImage({
            prompt: "Upscale this image to 4K resolution, maintain original details.",
            model: 'Nano Banana Pro',
            aspectRatio: el.genAspectRatio || '1:1',
            imageSize: '4K',
            referenceImage: base64Ref,
        });

        if (resultUrl) {
            const img = new Image();
            img.src = resultUrl;
            img.onload = () => {
                const update2 = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false, url: resultUrl } : e);
                setElements(update2);
                saveToHistory(update2, markers);
            };
        } else {
             throw new Error("No result");
        }
    } catch (e) {
        console.error(e);
        const updateFail = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false } : e);
        setElements(updateFail);
    }
  };

  const handleRemoveBg = async () => {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || !el.url) return;

    const update1 = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: true } : e);
    setElements(update1);

    try {
        const base64Ref = await urlToBase64(el.url);
        const resultUrl = await generateImage({
            prompt: "Remove the background of this image, keep the main subject isolated on a pure white background.",
            model: 'Nano Banana Pro', // Pro typically handles complex editing prompts better
            aspectRatio: el.genAspectRatio || '1:1',
            referenceImage: base64Ref,
        });

        if (resultUrl) {
            const img = new Image();
            img.src = resultUrl;
            img.onload = () => {
                const update2 = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false, url: resultUrl } : e);
                setElements(update2);
                saveToHistory(update2, markers);
            };
        } else {
             throw new Error("No result");
        }
    } catch (e) {
        console.error(e);
        const updateFail = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false } : e);
        setElements(updateFail);
    }
  };

  const handleEditTextClick = async () => {
      if (!selectedElementId) return;
      const el = elements.find(e => e.id === selectedElementId);
      if (!el || !el.url) return;

      setIsExtractingText(true);
      try {
          const base64Ref = await urlToBase64(el.url);
          const extractedTexts = await extractTextFromImage(base64Ref);
          setDetectedTexts(extractedTexts);
          setEditedTexts([...extractedTexts]); // Initialize editable texts
          setShowTextEditModal(true);
      } catch (e) {
          console.error("Text extraction failed", e);
      } finally {
          setIsExtractingText(false);
      }
  };

  const handleApplyTextEdits = async () => {
      if (!selectedElementId || detectedTexts.length === 0) return;
      const el = elements.find(e => e.id === selectedElementId);
      if (!el || !el.url) return;

      setShowTextEditModal(false);
      const update1 = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: true } : e);
      setElements(update1);

      // Construct prompt for text replacement
      let editPrompt = "Edit the text in the image. ";
      let changes = [];
      for (let i = 0; i < detectedTexts.length; i++) {
          if (detectedTexts[i] !== editedTexts[i]) {
              changes.push(`Replace text "${detectedTexts[i]}" with "${editedTexts[i]}"`);
          }
      }
      
      if (changes.length === 0) {
          // No changes, just revert loading state
          const updateRevert = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false } : e);
          setElements(updateRevert);
          return;
      }

      editPrompt += changes.join(". ") + ". Maintain the original font style and color as much as possible.";

      try {
          const base64Ref = await urlToBase64(el.url);
          const resultUrl = await generateImage({
              prompt: editPrompt,
              model: 'Nano Banana Pro',
              aspectRatio: el.genAspectRatio || '1:1',
              referenceImage: base64Ref,
          });

          if (resultUrl) {
              const img = new Image();
              img.src = resultUrl;
              img.onload = () => {
                  const update2 = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false, url: resultUrl } : e);
                  setElements(update2);
                  saveToHistory(update2, markers);
              };
          } else {
               throw new Error("No result");
          }
      } catch (e) {
          console.error(e);
          const updateFail = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false } : e);
          setElements(updateFail);
      }
  };

  const handleFastEditRun = async () => {
    if (!selectedElementId || !fastEditPrompt) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || !el.url) return;
    const update1 = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: true } : e);
    setElements(update1);
    try {
        const base64Ref = await urlToBase64(el.url);
        const resultUrl = await generateImage({
            prompt: fastEditPrompt,
            model: el.genModel as any || 'Nano Banana Pro',
            aspectRatio: el.genAspectRatio || '1:1',
            referenceImage: base64Ref,
        });
        if (resultUrl) {
            const img = new Image();
            img.src = resultUrl;
            img.onload = () => {
                const update2 = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false, url: resultUrl } : e);
                setElements(update2);
                saveToHistory(update2, markers);
                setShowFastEdit(false);
                setFastEditPrompt('');
            };
        } else {
             throw new Error("No result");
        }
    } catch (e) {
        console.error(e);
         const updateFail = elements.map(e => e.id === selectedElementId ? { ...e, isGenerating: false } : e);
        setElements(updateFail);
    }
  };

  // Handle Model Mode Switching
  useEffect(() => {
      // 'thinking' -> gemini-3-pro-preview
      // 'fast' -> gemini-3-flash-preview
      const modelName = modelMode === 'thinking' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      
      // Preserve history when switching models if possible, but basic recreation here
      const historyContent: Content[] = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      chatSessionRef.current = createChatSession(modelName, historyContent);
  }, [modelMode]);

  useEffect(() => {
    if (id) {
        const load = async () => {
            const project = await getProject(id);
            if (project) {
                if (project.elements) setElements(project.elements);
                if (project.markers) setMarkers(project.markers);
                if (project.title) setProjectTitle(project.title);
                setHistory([{ elements: project.elements || [], markers: project.markers || [] }]);
                setHistoryStep(0);
            }
        };
        load();
    }
    if (location.state?.initialPrompt || location.state?.initialAttachments) {
       if (!initialPromptProcessedRef.current) {
         initialPromptProcessedRef.current = true;
         const blocks: InputBlock[] = [];
         if (location.state.initialAttachments) {
             (location.state.initialAttachments as File[]).forEach((f, i) => {
                 blocks.push({ id: `file-${Date.now()}-${i}`, type: 'file', file: f });
                 blocks.push({ id: `text-${Date.now()}-${i}`, type: 'text', text: '' });
             });
         }
         if (location.state.initialPrompt) {
             if (blocks.length > 0 && blocks[blocks.length-1].type === 'text') {
                 blocks[blocks.length-1].text = location.state.initialPrompt;
             } else {
                 blocks.push({ id: `text-${Date.now()}`, type: 'text', text: location.state.initialPrompt });
             }
         }
         if (blocks.length === 0) blocks.push({ id: 'init', type: 'text', text: '' });
         setInputBlocks(blocks);

         if (location.state.initialModelMode) setModelMode(location.state.initialModelMode);
         if (location.state.initialWebEnabled) setWebEnabled(location.state.initialWebEnabled);
         if (location.state.initialImageModel) setImageModelEnabled(true);
         handleSend(location.state.initialPrompt, location.state.initialAttachments, location.state.initialWebEnabled);
       }
    }
    if (location.state?.backgroundUrl) {
        const type = location.state.backgroundType || 'image';
        const url = location.state.backgroundUrl;
        const containerW = window.innerWidth - 400;
        const containerH = window.innerHeight;
        const newElement: CanvasElement = {
            id: Date.now().toString(), type, url, x: containerW / 2 - 200, y: containerH / 2 - 150, width: 400, height: 300, zIndex: 1
        };
        setElements(prev => { const next = [...prev, newElement]; setHistory([{ elements: next, markers: [] }]); return next; });
    }
    if (!chatSessionRef.current) {
        // Default to PRO_MODEL (thinking)
        chatSessionRef.current = createChatSession('gemini-3-pro-preview');
    }
  }, [id, location.state]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
        setContextMenu(null);
        const target = e.target as HTMLElement;
        if (!target.closest('.history-popover-trigger') && !target.closest('.history-popover-content')) {
            setShowHistoryPopover(false);
        }
        if (!target.closest('.relative')) {
            setShowResPicker(false);
            setShowRatioPicker(false);
            setShowModelPicker(false);
            setShowFileListModal(false);
        }
    };
    const handleWindowPaste = (e: ClipboardEvent) => {
        if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT' || document.activeElement?.getAttribute('contenteditable')) return;
        if (e.clipboardData?.files.length) {
            e.preventDefault();
            const file = e.clipboardData.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = event.target?.result as string;
                    const img = new Image();
                    img.onload = () => {
                        let w = img.width;
                        let h = img.height;
                        const maxDim = 800;
                        if (w > maxDim || h > maxDim) {
                            const ratio = w / h;
                            if (w > h) { w = maxDim; h = maxDim / ratio; }
                            else { h = maxDim; w = maxDim * ratio; }
                        }
                        addElement('image', result, { width: w, height: h });
                    };
                    img.src = result;
                };
                reader.readAsDataURL(file);
            }
        }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('paste', handleWindowPaste);

    // Native wheel listener for non-passive behavior (Prevent Browser Zoom)
    const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -10 : 10;
            setZoom(z => Math.max(10, Math.min(500, z + delta)));
        } else {
            // Also prevent swipe-to-nav etc if necessary, but allow normal scroll if not zooming?
            // Actually users requested standard pan. 
            // If they are NOT zooming, we use React panning state.
            // But to be safe against touchpad gestures zooming the page:
            if (e.ctrlKey) e.preventDefault();
        }
    };
    
    // Attach to window to catch all scrolls and prevent browser zoom
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
        window.removeEventListener('click', handleGlobalClick);
        window.removeEventListener('paste', handleWindowPaste);
        window.removeEventListener('wheel', onWheel);
    };
  }, [elements, zoom, pan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
        if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(z => Math.min(200, z + 10)); return; }
        if ((e.metaKey || e.ctrlKey) && e.key === '-') { e.preventDefault(); setZoom(z => Math.max(10, z - 10)); return; }
        if ((e.metaKey || e.ctrlKey) && e.key === '0') { e.preventDefault(); setZoom(100); return; }
        if (e.shiftKey && e.key === '1') { e.preventDefault(); fitToScreen(); return; }
        if (e.code === 'Space' && !e.repeat) { const isTyping = document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT' || document.activeElement?.getAttribute('contenteditable') === 'true'; if (!isTyping) { e.preventDefault(); setIsSpacePressed(true); } }
        
        if (e.key === 'Tab') { 
            e.preventDefault(); 
            if (selectedElementId) {
                const el = elements.find(e => e.id === selectedElementId);
                if (el && (el.type === 'gen-image' || el.type === 'image') && el.url) {
                    setShowFastEdit(prev => !prev);
                    return;
                }
            }
            textareaRef.current?.focus(); 
        }

        if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT' && !document.activeElement?.getAttribute('contenteditable')) {
            if (e.key.toLowerCase() === 'v' && !(e.metaKey || e.ctrlKey)) setActiveTool('select');
            if (e.key.toLowerCase() === 'h') setActiveTool('hand');
            if (e.key.toLowerCase() === 'm') setActiveTool('mark');
            if (e.key === 'Backspace' || e.key === 'Delete') deleteSelectedElement();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [selectedElementId, history, historyStep, elements, markers]);

  const addElement = (type: 'image' | 'video', url: string, dims?: { width: number, height: number }) => { 
      const containerW = window.innerWidth - (showAssistant ? 400 : 0); 
      const containerH = window.innerHeight; 
      const centerX = (containerW / 2 - pan.x) / (zoom / 100); 
      const centerY = (containerH / 2 - pan.y) / (zoom / 100); 
      const width = dims?.width || 400;
      const height = dims?.height || 300;
      const newElement: CanvasElement = { id: Date.now().toString(), type, url, x: centerX - (width/2), y: centerY - (height/2), width, height, zIndex: elements.length + 1 }; 
      const newElements = [...elements, newElement]; 
      setElements(newElements); 
      saveToHistory(newElements, markers); 
  };
  
  const addShape = (shapeType: ShapeType) => {
      const containerW = window.innerWidth - (showAssistant ? 400 : 0);
      const containerH = window.innerHeight;
      const centerX = (containerW / 2 - pan.x) / (zoom / 100);
      const centerY = (containerH / 2 - pan.y) / (zoom / 100);
      const size = 100;
      const newElement: CanvasElement = {
          id: Date.now().toString(),
          type: 'shape',
          shapeType,
          x: centerX - (size / 2),
          y: centerY - (size / 2),
          width: size,
          height: size,
          fillColor: '#9CA3AF',
          strokeColor: 'transparent',
          strokeWidth: 2,
          cornerRadius: 0,
          aspectRatioLocked: false,
          zIndex: elements.length + 1
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      saveToHistory(newElements, markers);
      setSelectedElementId(newElement.id);
      setShowShapeMenu(false);
  };

  const addText = () => { const containerW = window.innerWidth - (showAssistant ? 400 : 0); const containerH = window.innerHeight; const centerX = (containerW / 2 - pan.x) / (zoom / 100); const centerY = (containerH / 2 - pan.y) / (zoom / 100); const newElement: CanvasElement = { id: Date.now().toString(), type: 'text', text: 'Type something...', x: centerX - 100, y: centerY - 25, width: 200, height: 50, fontSize: 90, fontFamily: 'Inter', fontWeight: 400, fillColor: '#000000', strokeColor: 'transparent', textAlign: 'left', zIndex: elements.length + 1 }; const newElements = [...elements, newElement]; setElements(newElements); saveToHistory(newElements, markers); setSelectedElementId(newElement.id); };
  const addGenImage = () => { const containerW = window.innerWidth - (showAssistant ? 400 : 0); const containerH = window.innerHeight; const centerX = (containerW / 2 - pan.x) / (zoom / 100); const centerY = (containerH / 2 - pan.y) / (zoom / 100); const newElement: CanvasElement = { id: Date.now().toString(), type: 'gen-image', x: centerX - 160, y: centerY - 160, width: 320, height: 320, zIndex: elements.length + 1, genModel: 'Nano Banana Pro', genAspectRatio: '1:1', genResolution: '1K', genPrompt: '' }; const newElements = [...elements, newElement]; setElements(newElements); saveToHistory(newElements, markers); setSelectedElementId(newElement.id); };
  const addGenVideo = () => { const containerW = window.innerWidth - (showAssistant ? 400 : 0); const containerH = window.innerHeight; const centerX = (containerW / 2 - pan.x) / (zoom / 100); const centerY = (containerH / 2 - pan.y) / (zoom / 100); const newElement: CanvasElement = { id: Date.now().toString(), type: 'gen-video', x: centerX - 240, y: centerY - 135, width: 480, height: 270, zIndex: elements.length + 1, genModel: 'Veo 3.1 Fast', genAspectRatio: '16:9', genPrompt: '', genDuration: '5s' }; const newElements = [...elements, newElement]; setElements(newElements); saveToHistory(newElements, markers); setSelectedElementId(newElement.id); };

  const getClosestAspectRatio = (width: number, height: number): string => { const ratio = width / height; let closest = '1:1'; let minDiff = Infinity; for (const ar of ASPECT_RATIOS) { const [w, h] = ar.value.split(':').map(Number); const r = w / h; const diff = Math.abs(ratio - r); if (diff < minDiff) { minDiff = diff; closest = ar.value; } } return closest; };
  
  const handleGenImage = async (elementId: string) => {
    const el = elements.find(e => e.id === elementId);
    if (!el || !el.genPrompt) return;
    const update1 = elements.map(e => e.id === elementId ? { ...e, isGenerating: true } : e);
    setElements(update1);
    const currentAspectRatio = getClosestAspectRatio(el.width, el.height);
    const model: 'Nano Banana' | 'Nano Banana Pro' = (el.genModel === 'Nano Banana' || el.genModel === 'Nano Banana Pro') ? el.genModel : 'Nano Banana Pro';
    try {
      const resultUrl = await generateImage({
        prompt: el.genPrompt,
        model: model,
        aspectRatio: currentAspectRatio,
        imageSize: el.genResolution,
        referenceImage: el.genRefImage
      });
      if (resultUrl) {
        const img = new Image();
        img.src = resultUrl;
        img.onload = () => {
          const update2 = elements.map(e => e.id === elementId ? { ...e, isGenerating: false, url: resultUrl } : e);
          setElements(update2);
          saveToHistory(update2, markers);
        };
      } else {
        const updateFail = elements.map(e => e.id === elementId ? { ...e, isGenerating: false } : e);
        setElements(updateFail);
      }
    } catch (e) {
      console.error(e);
      const updateFail = elements.map(e => e.id === elementId ? { ...e, isGenerating: false } : e);
      setElements(updateFail);
    }
  };

  const handleGenVideo = async (elementId: string) => { 
      const el = elements.find(e => e.id === elementId); 
      if (!el || !el.genPrompt) return; 
      const update1 = elements.map(e => e.id === elementId ? { ...e, isGenerating: true } : e); 
      setElements(update1); 
      try { 
          // If Veo 3.1 Fast, we can use startFrame/endFrame directly or map from refImages if that's what UI populated
          // The UI uses `genVideoRefs` for Fast model too (as single ref).
          let startFrame = el.genStartFrame;
          if (!startFrame && el.genModel?.includes('Fast') && el.genVideoRefs?.[0]) {
              startFrame = el.genVideoRefs[0];
          }

          const resultUrl = await generateVideo({ 
              prompt: el.genPrompt, 
              aspectRatio: el.genAspectRatio as any || '16:9', 
              model: el.genModel as any || 'Veo 3.1 Fast', 
              startFrame: startFrame, 
              endFrame: el.genEndFrame, 
              referenceImages: el.genVideoRefs 
          }); 
          if (resultUrl) { 
              const update2 = elements.map(e => e.id === elementId ? { ...e, isGenerating: false, url: resultUrl } : e); 
              setElements(update2); 
              saveToHistory(update2, markers); 
          } else { 
              const updateFail = elements.map(e => e.id === elementId ? { ...e, isGenerating: false } : e); 
              setElements(updateFail); 
          } 
      } catch (e) { 
          console.error(e); 
          const updateFail = elements.map(e => e.id === elementId ? { ...e, isGenerating: false } : e); 
          setElements(updateFail); 
      } 
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => { 
      const file = e.target.files?.[0]; 
      if (!file) return; 
      const reader = new FileReader(); 
      reader.onload = (event) => { 
          const result = event.target?.result as string; 
          if (type === 'image') {
              const img = new Image();
              img.onload = () => {
                  let w = img.width;
                  let h = img.height;
                  const maxDim = 800;
                  if (w > maxDim || h > maxDim) {
                      const ratio = w / h;
                      if (w > h) { w = maxDim; h = maxDim / ratio; }
                      else { h = maxDim; w = maxDim * ratio; }
                  }
                  addElement(type, result, { width: w, height: h }); 
                  setShowInsertMenu(false); 
              };
              img.src = result;
          } else {
              addElement(type, result); 
              setShowInsertMenu(false); 
          }
      }; 
      reader.readAsDataURL(file); 
  };
  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>, elementId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const result = event.target?.result as string;
        updateSelectedElement({ genRefImage: result });
    };
    reader.readAsDataURL(file);
  };


  const handleVideoRefUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end' | 'ref', index?: number) => {
      const file = e.target.files?.[0];
      if (!file || !selectedElementId) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const result = event.target?.result as string;
          const el = elements.find(e => e.id === selectedElementId);
          if (!el) return;
          if (type === 'start') {
              updateSelectedElement({ genStartFrame: result });
          } else if (type === 'end') {
              updateSelectedElement({ genEndFrame: result });
          } else if (type === 'ref') {
              const currentRefs = el.genVideoRefs || [];
              if (index !== undefined) {
                  const newRefs = [...currentRefs];
                  newRefs[index] = result;
                  updateSelectedElement({ genVideoRefs: newRefs });
              } else {
                  updateSelectedElement({ genVideoRefs: [...currentRefs, result] });
              }
          }
      };
      reader.readAsDataURL(file);
  };
  
  const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); };
  // Wheel handled by native listener in useEffect
  const handleMouseDown = (e: React.MouseEvent) => { if (contextMenu) setContextMenu(null); if (activeTool === 'hand' || e.button === 1 || e.buttons === 4 || isSpacePressed) { setIsPanning(true); setDragStart({ x: e.clientX, y: e.clientY }); return; } if (e.target === containerRef.current) { setSelectedElementId(null); setEditingTextId(null); setIsPanning(true); setDragStart({ x: e.clientX, y: e.clientY }); setShowFontPicker(false); setShowModelPicker(false); setShowResPicker(false); setShowRatioPicker(false); } };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing && selectedElementId) {
        const dx = (e.clientX - resizeStart.x) / (zoom / 100);
        const dy = (e.clientY - resizeStart.y) / (zoom / 100);
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.left;
        let newY = resizeStart.top;
        if (resizeHandle?.includes('e')) newWidth = Math.max(20, resizeStart.width + dx);
        if (resizeHandle?.includes('s')) newHeight = Math.max(20, resizeStart.height + dy);
        if (resizeHandle?.includes('w')) {
            const widthDiff = Math.min(resizeStart.width - 20, dx);
            newWidth = resizeStart.width - widthDiff;
            newX = resizeStart.left + widthDiff;
        }
        if (resizeHandle?.includes('n')) {
            const heightDiff = Math.min(resizeStart.height - 20, dy);
            newHeight = resizeStart.height - heightDiff;
            newY = resizeStart.top + heightDiff;
        }
        const el = elements.find(e => e.id === selectedElementId);
        if (el?.aspectRatioLocked) {
            const ratio = resizeStart.width / resizeStart.height;
            if (resizeHandle?.includes('e') || resizeHandle?.includes('w')) { newHeight = newWidth / ratio; } else if (resizeHandle?.includes('n') || resizeHandle?.includes('s')) { newWidth = newHeight * ratio; } else { newHeight = newWidth / ratio; }
        }
        setElements(prev => prev.map(el => {
            if (el.id === selectedElementId) {
                const ar = getClosestAspectRatio(newWidth, newHeight);
                return { ...el, x: newX, y: newY, width: newWidth, height: newHeight, genAspectRatio: el.type === 'gen-image' ? ar : el.genAspectRatio };
            }
            return el;
        }));
        return;
    }
    if (isPanning) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDraggingElement && selectedElementId) {
        const dx = (e.clientX - dragStart.x) / (zoom / 100);
        const dy = (e.clientY - dragStart.y) / (zoom / 100);
        setElements(prev => prev.map(el => {
            if (el.id === selectedElementId) {
                return { ...el, x: elementStartPos.x + dx, y: elementStartPos.y + dy };
            }
            return el;
        }));
    }
  };

  const handleMouseUp = () => { if (isResizing) { setIsResizing(false); setResizeHandle(null); saveToHistory(elements, markers); } if (isDraggingElement && selectedElementId) { const el = elements.find(e => e.id === selectedElementId); if (el && (el.x !== elementStartPos.x || el.y !== elementStartPos.y)) { saveToHistory(elements, markers); } } setIsPanning(false); setIsDraggingElement(false); };
  
  // Crop Image Utility
  const cropImageRegion = async (imageUrl: string, xPct: number, yPct: number, width: number = 200, height: number = 200): Promise<string | null> => {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = imageUrl;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(null); return; }
              
              const sourceX = (xPct / 100) * img.naturalWidth - (width / 2);
              const sourceY = (yPct / 100) * img.naturalHeight - (height / 2);
              
              // Draw zoomed crop
              ctx.drawImage(img, sourceX, sourceY, width, height, 0, 0, width, height);
              resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
      });
  };

  const handleElementMouseDown = async (e: React.MouseEvent, id: string) => { 
      if (isSpacePressed || activeTool === 'hand') return; 
      e.stopPropagation(); 
      
      if (activeTool === 'mark' || e.ctrlKey || e.metaKey) { 
          const rect = e.currentTarget.getBoundingClientRect(); 
          const x = ((e.clientX - rect.left) / rect.width) * 100; 
          const y = ((e.clientY - rect.top) / rect.height) * 100; 
          
          const newMarkerId = markers.length + 1;
          
          // Crop and Add to Input Box logic
          const el = elements.find(e => e.id === id);
          let cropUrl: string | undefined = undefined;
          
          if (el && (el.type === 'image' || el.type === 'gen-image') && el.url) {
              const crop = await cropImageRegion(el.url, x, y, 300, 300);
              if (crop) {
                  cropUrl = crop;
                  
                  // 先打开助手面板，确保输入框已渲染
                  if (!showAssistant) {
                      setShowAssistant(true);
                      // 等待助手面板渲染完成
                      await new Promise(resolve => setTimeout(resolve, 100));
                  }
                  
                  // Convert crop to File and Add to Input Box
                  const file = dataURLtoFile(crop, `marker-${newMarkerId}.png`);
                  (file as any).markerId = newMarkerId;
                  
                  // 使用 setTimeout 确保状态更新后再插入
                  setTimeout(() => {
                      insertInputFile(file);
                      console.log('File inserted:', file.name, 'Marker ID:', newMarkerId);
                  }, 150);
              }
          }
          
          const newMarkers = [...markers, { id: newMarkerId, x, y, elementId: id, cropUrl }]; 
          setMarkers(newMarkers); 
          saveToHistory(elements, newMarkers); 
          return; 
      } 
      
      if (id !== selectedElementId) setEditingTextId(null); 
      setSelectedElementId(id); 
      setIsDraggingElement(true); 
      setDragStart({ x: e.clientX, y: e.clientY }); 
      const el = elements.find(e => e.id === id); 
      if (el) setElementStartPos({ x: el.x, y: el.y }); 
  };
  
  const handleResizeStart = (e: React.MouseEvent, handle: string, elementId: string) => { e.stopPropagation(); e.preventDefault(); const el = elements.find(e => e.id === elementId); if (!el) return; setIsResizing(true); setResizeHandle(handle); setResizeStart({ x: e.clientX, y: e.clientY, width: el.width, height: el.height, left: el.x, top: el.y }); };
  const removeMarker = (id: number) => { const newMarkers = markers.filter(m => m.id !== id).map((m, i) => ({ ...m, id: i + 1 })); setMarkers(newMarkers); saveToHistory(elements, newMarkers); };

  const handleToolMenuMouseEnter = () => { if (closeToolMenuTimerRef.current) clearTimeout(closeToolMenuTimerRef.current); setShowInsertMenu(false); setShowShapeMenu(false); setShowToolMenu(true); };
  const handleToolMenuMouseLeave = () => { closeToolMenuTimerRef.current = setTimeout(() => { setShowToolMenu(false); }, 100); };
  const handleMenuMouseEnter = () => { if (closeMenuTimerRef.current) { clearTimeout(closeMenuTimerRef.current); closeMenuTimerRef.current = null; } setShowToolMenu(false); setShowShapeMenu(false); setShowInsertMenu(true); };
  const handleMenuMouseLeave = () => { closeMenuTimerRef.current = setTimeout(() => { setShowInsertMenu(false); }, 100); };
  const handleShapeMenuMouseEnter = () => { if (closeShapeMenuTimerRef.current) { clearTimeout(closeShapeMenuTimerRef.current); closeShapeMenuTimerRef.current = null; } setShowToolMenu(false); setShowInsertMenu(false); setShowShapeMenu(true); };
  const handleShapeMenuMouseLeave = () => { closeShapeMenuTimerRef.current = setTimeout(() => { setShowShapeMenu(false); }, 100); };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { 
      if (e.target.files) {
          const files = Array.from(e.target.files!);
          files.forEach(f => insertInputFile(f as File));
      }
      if (fileInputRef.current) fileInputRef.current.value = ''; 
  };
  
  const removeInputBlock = (blockId: string) => {
      setInputBlocks(prev => {
          // If removing a file block, we should merge adjacent text blocks
          const idx = prev.findIndex(b => b.id === blockId);
          if (idx === -1) return prev;
          
          const newBlocks = [...prev];
          
          // Logic: remove block at idx
          // Check if left and right are text
          const left = newBlocks[idx - 1];
          const right = newBlocks[idx + 1];
          
          // Also remove corresponding markers from canvas if this file had a markerId
          const block = newBlocks[idx];
          if (block.file && (block.file as any).markerId) {
             const markerId = (block.file as any).markerId;
             const newMarkers = markers.filter(m => m.id !== markerId).map((m, i) => ({ ...m, id: i + 1 }));
             // Need to update markerIds in OTHER blocks too?
             // Since markers state is external, we update it.
             // But the file objects in OTHER blocks still hold old markerIds.
             // We need to update those active file objects.
             // This is tricky with React State immutability inside File objects. But 'insertInputFile' uses references.
             // We should map inputBlocks to update file markerIds.
             
             // First, update canvas markers
             setMarkers(newMarkers);
             saveToHistory(elements, newMarkers);
             
             // Then update inputBlocks' files
             newBlocks.forEach(b => {
                 if (b.type === 'file' && b.file && (b.file as any).markerId > markerId) {
                     (b.file as any).markerId -= 1;
                 }
             });
          }

          if (left?.type === 'text' && right?.type === 'text') {
               // Merge
               left.text = (left.text || '') + (right.text || '');
               // Remove current and right
               newBlocks.splice(idx, 2);
               // Focus left
               setActiveBlockId(left.id);
          } else {
              // Just remove
              newBlocks.splice(idx, 1);
              // If we removed the last block and it's empty, ensure at least one text block?
              if (newBlocks.length === 0) newBlocks.push({ id: `text-${Date.now()}`, type: 'text', text: '' });
          }
          
          return newBlocks;
      });
  };

  const handleSend = async (textOverride?: string, attachmentsOverride?: File[], enableWebSearch: boolean = webEnabled) => {
    // Construct message from blocks
    const derivedText = inputBlocks.filter(b => b.type === 'text').map(b => b.text).join(' ');
    const derivedFiles = inputBlocks.filter(b => b.type === 'file' && b.file).map(b => b.file!) as File[];

    const textToSend = textOverride !== undefined ? textOverride : derivedText;
    const filesToSend = attachmentsOverride !== undefined ? attachmentsOverride : derivedFiles;

    if ((!textToSend.trim() && filesToSend.length === 0 && markers.length === 0) || isTyping) return;

    // Agent mode handling
    if (agentMode && isAgentMode && textToSend.trim()) {
      const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
      setMessages(prev => [...prev, newUserMsg]);
      setInputBlocks([{ id: `text-${Date.now()}`, type: 'text', text: '' }]);
      setIsTyping(true);

      try {
        const agentResult = await processMessage(textToSend, filesToSend);
        if (agentResult?.output?.message) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: agentResult.output.message,
            timestamp: Date.now()
          }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), role: 'model', text: `Error: ${error instanceof Error ? error.message : 'Unknown'}`, timestamp: Date.now() }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }
    
    let fullMessage = textToSend;
    
    // Check if there are marker attachments and append context
    const markerFiles = filesToSend.filter(f => (f as any).markerId);
    if (markerFiles.length > 0) {
        fullMessage += ` [Analyzing ${markerFiles.length} marked regions]`;
    }

    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: fullMessage + (filesToSend.length > 0 ? ` [${filesToSend.length} files attached]` : ''), timestamp: Date.now() };
    setMessages(prev => [...prev, newUserMsg]); 
    setInputBlocks([{ id: `text-${Date.now()}`, type: 'text', text: '' }]);
    setMarkers([]); 
    setIsTyping(true);
    if (chatSessionRef.current) {
        const responseText = await sendMessage(chatSessionRef.current, fullMessage, filesToSend, enableWebSearch);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() }]);
    }
    setIsTyping(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setInputBlocks([{ id: 'init', type: 'text', text: '' }]);
    setMarkers([]);
    setHistoryStep(0);
    chatSessionRef.current = createChatSession('gemini-3-pro-preview');
    setShowHistoryPopover(false);
  };

  const renderToolbar = () => {
    let NavIcon = MousePointer2;
    if (activeTool === 'hand') NavIcon = Hand;
    if (activeTool === 'mark') NavIcon = MapPin;
    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-2 z-50 animate-in fade-in slide-in-from-left-4 duration-300 items-center w-12">
             <div className="relative group/nav">
                <button className={`p-2 rounded-xl transition ${['select', 'hand', 'mark'].includes(activeTool) ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}><NavIcon size={18} /></button>
                <div className="absolute left-full top-0 ml-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-50 hidden group-hover/nav:flex flex-col gap-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                    <button onClick={() => setActiveTool('select')} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${activeTool === 'select' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><MousePointer2 size={16} /> Select</div><span className="text-xs text-gray-400 font-medium">V</span></button>
                    <button onClick={() => setActiveTool('hand')} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${activeTool === 'hand' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><Hand size={16} /> Hand tool</div><span className="text-xs text-gray-400 font-medium">H</span></button>
                    <button onClick={() => setActiveTool('mark')} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${activeTool === 'mark' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}><div className="flex items-center gap-3"><MapPin size={16} /> Mark</div><span className="text-xs text-gray-400 font-medium">M</span></button>
                </div>
             </div>
             <div className="relative group/menu">
                <button className={`p-2 rounded-xl transition ${showShapeMenu ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`} onMouseEnter={handleShapeMenuMouseEnter} onMouseLeave={handleShapeMenuMouseLeave}><Square size={18} /></button>
                {showShapeMenu && (
                    <div className="absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 grid grid-cols-2 gap-1 animate-in fade-in slide-in-from-left-2 duration-200 z-50 w-20" onMouseEnter={handleShapeMenuMouseEnter} onMouseLeave={handleShapeMenuMouseLeave}>
                        <ShapeMenuItem icon={Square} onClick={() => addShape('square')} />
                        <ShapeMenuItem icon={CircleIcon} onClick={() => addShape('circle')} />
                        <ShapeMenuItem icon={Triangle} onClick={() => addShape('triangle')} />
                        <ShapeMenuItem icon={Star} onClick={() => addShape('star')} />
                        <ShapeMenuItem icon={MessageSquare} onClick={() => addShape('bubble')} />
                        <ShapeMenuItem icon={ArrowLeft} onClick={() => addShape('arrow-left')} />
                        <ShapeMenuItem icon={ArrowRight} onClick={() => addShape('arrow-right')} />
                    </div>
                )}
             </div>
             <TooltipButton icon={Type} label="Text (T)" onClick={addText} />
             <TooltipButton icon={ImagePlus} label="AI Image Gen" onClick={() => addGenImage()} />
             <TooltipButton icon={Video} label="AI Video Gen" onClick={() => addGenVideo()} />
             <div className="relative group/menu">
                 <button className={`p-2 rounded-xl transition ${showInsertMenu ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`} onMouseEnter={handleMenuMouseEnter} onMouseLeave={handleMenuMouseLeave}><Plus size={18} /></button>
                 {showInsertMenu && (
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col gap-1" onMouseEnter={handleMenuMouseEnter} onMouseLeave={handleMenuMouseLeave}>
                        <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 cursor-pointer transition"><ImageIcon size={16} /> Image <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} /></label>
                        <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 cursor-pointer transition"><Video size={16} /> Video <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} /></label>
                    </div>
                 )}
             </div>
             <div className="h-px w-6 bg-gray-200 my-1 self-center"></div>
             <TooltipButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={undo} showTooltipOnHover={true} />
             <TooltipButton icon={Redo2} label="Redo (Ctrl+Y)" onClick={redo} showTooltipOnHover={true} />
        </div>
    );
  };

  const renderContextMenu = () => {
      if (!contextMenu) return null;
      const el = selectedElementId ? elements.find(e => e.id === selectedElementId) : null;
      const isImage = el && (el.type === 'image' || (el.type === 'gen-image' && el.url));
      return (
          <div 
            className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200/80 py-1.5 w-52 text-sm backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()} 
          >
              <button onClick={() => { handleManualPaste(); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex justify-between items-center group">
                  <span>粘贴</span><span className="text-xs text-gray-400 font-sans group-hover:text-gray-500">Ctrl + V</span>
              </button>
              {isImage && (
                 <button onClick={handleDownload} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex justify-between items-center group">
                    <span>下载图片</span><Download size={14} className="text-gray-400 group-hover:text-gray-500" />
                 </button>
              )}
              <div className="h-px bg-gray-100 my-1"></div>
              <button onClick={() => { setZoom(z => Math.min(200, z + 10)); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex justify-between items-center group">
                  <span>放大</span><span className="text-xs text-gray-400 font-sans group-hover:text-gray-500">Ctrl + +</span>
              </button>
              <button onClick={() => { setZoom(z => Math.max(10, z - 10)); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex justify-between items-center group">
                  <span>缩小</span><span className="text-xs text-gray-400 font-sans group-hover:text-gray-500">Ctrl + -</span>
              </button>
              <button onClick={() => { fitToScreen(); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex justify-between items-center group">
                  <span>显示画布所有图片</span><span className="text-xs text-gray-400 font-sans group-hover:text-gray-500">Shift + 1</span>
              </button>
              <button onClick={() => { setZoom(100); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex justify-between items-center group">
                  <span>缩放至100%</span><span className="text-xs text-gray-400 font-sans group-hover:text-gray-500">Ctrl + 0</span>
              </button>
          </div>
      );
  };

  const renderTextToolbar = () => { if (!selectedElementId) return null; const el = elements.find(e => e.id === selectedElementId); if (!el || el.type !== 'text') return null; return (<div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 flex items-center gap-1 z-40 animate-in fade-in slide-in-from-top-2"> <div className="relative"><button onClick={() => setShowFontPicker(!showFontPicker)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg text-sm font-medium w-32 justify-between"><span className="truncate">{el.fontFamily}</span><ChevronDown size={12} /></button>{showFontPicker && (<div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50">{FONTS.map(font => (<button key={font} onClick={() => { updateSelectedElement({ fontFamily: font }); setShowFontPicker(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm" style={{ fontFamily: font }}>{font}</button>))}</div>)}</div><div className="w-px h-4 bg-gray-200 mx-1"></div><button onClick={() => updateSelectedElement({ fontWeight: el.fontWeight === 700 ? 400 : 700 })} className={`p-1.5 rounded-lg ${el.fontWeight === 700 ? 'bg-gray-200 text-black' : 'hover:bg-gray-100 text-gray-600'}`}><BoldIcon size={16} /></button><button onClick={() => updateSelectedElement({ textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' })} className={`p-1.5 rounded-lg ${el.textDecoration === 'underline' ? 'bg-gray-200 text-black' : 'hover:bg-gray-100 text-gray-600'}`}><Underline size={16} /></button><div className="w-px h-4 bg-gray-200 mx-1"></div><div className="flex items-center gap-2 px-2"><div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200 cursor-pointer shadow-sm"><input type="color" value={el.fillColor} onChange={(e) => updateSelectedElement({ fillColor: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-0" /></div></div></div>); };
  
  const renderShapeToolbar = () => {
    if (!selectedElementId) return null;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || el.type !== 'shape') return null;
    return (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 flex items-center gap-3 z-40 animate-in fade-in slide-in-from-top-2 px-3 whitespace-nowrap">
             <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-300 shadow-sm cursor-pointer hover:ring-2 hover:ring-gray-200 transition">
                <div className="w-full h-full" style={{ backgroundColor: el.fillColor }}></div>
                <input type="color" value={el.fillColor} onChange={(e) => updateSelectedElement({ fillColor: e.target.value })} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
             </div>
             <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-300 shadow-sm cursor-pointer hover:ring-2 hover:ring-gray-200 transition bg-white flex items-center justify-center">
                 <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: el.strokeColor === 'transparent' ? '#E5E7EB' : el.strokeColor }}></div>
                 {el.strokeColor === 'transparent' && <div className="absolute w-full h-0.5 bg-red-400 rotate-45"></div>}
                 <input type="color" value={el.strokeColor === 'transparent' ? '#ffffff' : el.strokeColor} onChange={(e) => updateSelectedElement({ strokeColor: e.target.value })} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
             </div>
             <div className="w-px h-6 bg-gray-200"></div>
             <div className="flex items-center gap-2 text-gray-500">
                <CornerUpRight size={16} />
                <input type="number" value={el.cornerRadius || 0} onChange={(e) => updateSelectedElement({ cornerRadius: Number(e.target.value) })} className="w-12 h-7 bg-gray-50 border border-gray-200 rounded-md text-xs px-1 text-center focus:outline-none focus:border-gray-400" min="0" />
             </div>
             <div className="w-px h-6 bg-gray-200"></div>
             <div className="flex items-center gap-2"><span className="text-xs font-medium text-gray-400">W</span><input type="number" value={Math.round(el.width)} onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })} className="w-14 h-8 bg-gray-50 border border-gray-200 rounded-lg text-sm px-2 text-center focus:outline-none focus:border-gray-400" /></div>
             <button onClick={() => updateSelectedElement({ aspectRatioLocked: !el.aspectRatioLocked })} className={`p-1 rounded-md transition ${el.aspectRatioLocked ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`} >{el.aspectRatioLocked ? <Link2 size={14} /> : <Unlink size={14} />}</button>
             <div className="flex items-center gap-2"><span className="text-xs font-medium text-gray-400">H</span><input type="number" value={Math.round(el.height)} onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })} className="w-14 h-8 bg-gray-50 border border-gray-200 rounded-lg text-sm px-2 text-center focus:outline-none focus:border-gray-400" /></div>
             <div className="w-px h-6 bg-gray-200"></div>
             <button className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition"><Download size={16} /></button>
        </div>
    );
  };

  const renderImageToolbar = () => {
    if (!selectedElementId) return null;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || (el.type !== 'gen-image' && el.type !== 'image')) return null;
    
    // Only show if it has a URL (actual image)
    if (!el.url && el.type === 'gen-image') return null; // Let the generation placeholder handle itself or standard UI

    const screenX = el.x * (zoom / 100) + pan.x;
    const screenY = el.y * (zoom / 100) + pan.y;
    const screenWidth = el.width * (zoom / 100);
    const screenHeight = el.height * (zoom / 100);

    const topToolbarTop = screenY - 86;   
    const bottomButtonTop = screenY + screenHeight + 16;
    const centerX = screenX + (screenWidth / 2);
    
    // Text Edit Modal logic
    if (showTextEditModal) {
        const modalLeft = screenX + screenWidth + 20;
        const modalTop = screenY;
        return (
            <div 
                className="absolute bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-[60] w-64 animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col gap-2"
                style={{ left: modalLeft, top: modalTop }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
                    <Type size={16} /> <span>编辑文字</span>
                </div>
                {isExtractingText ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-xs">识别文字中...</span>
                    </div>
                ) : (
                    <>
                        <div className="max-h-64 overflow-y-auto flex flex-col gap-2 no-scrollbar">
                            {detectedTexts.map((text, index) => (
                                <input 
                                    key={index}
                                    value={editedTexts[index]}
                                    onChange={(e) => {
                                        const newTexts = [...editedTexts];
                                        newTexts[index] = e.target.value;
                                        setEditedTexts(newTexts);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            ))}
                            {detectedTexts.length === 0 && <div className="text-xs text-gray-400 text-center py-4">未检测到文字</div>}
                        </div>
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                            <button onClick={() => setShowTextEditModal(false)} className="flex-1 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition">取消</button>
                            <button onClick={handleApplyTextEdits} className="flex-1 py-1.5 text-xs font-medium bg-gray-900 text-white hover:bg-black rounded-lg transition flex items-center justify-center gap-1">
                                应用修改 <Zap size={10} className="text-yellow-400" /> 10
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="absolute bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 px-2 py-1.5 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 duration-200 -translate-x-1/2 whitespace-nowrap" style={{ left: centerX, top: topToolbarTop }} onMouseDown={(e) => e.stopPropagation()}>
                <button onClick={handleUpscale} className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-1.5 text-xs font-medium group relative">
                    <div className="relative w-3.5 h-3.5 border border-current rounded-[2px] flex items-center justify-center font-bold text-[8px]">HD</div> 放大
                </button>
                <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
                <button onClick={handleRemoveBg} className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-1.5 text-xs font-medium">
                    <div className="relative"><Eraser size={14} /><div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-white border border-gray-600 rounded-full"></div></div> 移除背景
                </button>
                <button className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-1.5 text-xs font-medium"><Shirt size={14} /> Mockup</button>
                <button className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-1.5 text-xs font-medium"><Eraser size={14} /> 擦除</button>
                <button className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-1.5 text-xs font-medium"><Layers size={14} /> 编辑元素</button>
                <button onClick={handleEditTextClick} className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-1.5 text-xs font-medium relative">
                    <Type size={14} /> 编辑文字
                    {el.type === 'gen-image' && <span className="absolute -top-1 -right-1 flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
                </button>
                <button className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-1.5 text-xs font-medium"><Expand size={14} /> 扩展</button>
                <button className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg"><MoreHorizontal size={14} /></button>
                <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
                <button onClick={handleDownload} className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg"><Download size={14} /></button>
            </div>
            
            {showFastEdit ? (
                <div className="absolute bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 -translate-x-1/2 w-64" style={{ left: centerX, top: bottomButtonTop }} onMouseDown={(e) => e.stopPropagation()}>
                        <textarea autoFocus className="w-full text-sm text-gray-700 placeholder:text-gray-300 bg-transparent border-none outline-none resize-none h-16 mb-1 p-1" placeholder="Describe your edit here" value={fastEditPrompt} onChange={(e) => setFastEditPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFastEditRun(); } e.stopPropagation(); }} />
                        <div className="flex justify-end">
                            <button onClick={handleFastEditRun} disabled={!fastEditPrompt || el.isGenerating} className="bg-gray-500 hover:bg-black text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50">
                            {el.isGenerating ? <Loader2 size={12} className="animate-spin" /> : null}
                            生成 {el.isGenerating ? '' : <span className="opacity-50 font-normal">↵</span>}
                            </button>
                        </div>
                </div>
            ) : (
                <div onClick={() => setShowFastEdit(true)} className="absolute bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2 z-50 animate-in fade-in duration-300 -translate-x-1/2 flex items-center gap-2 cursor-pointer hover:shadow-md transition group" style={{ left: centerX, top: bottomButtonTop }} onMouseDown={(e) => e.stopPropagation()}>
                    <span className="text-sm text-gray-700 font-medium group-hover:text-black">快捷编辑</span>
                    <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 ml-1">Tab</span>
                </div>
            )}
        </>
    );
  };

  const renderGenVideoToolbar = () => {
    if (!selectedElementId) return null;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || (el.type !== 'gen-video' && el.type !== 'video')) return null;
    const screenX = el.x * (zoom / 100) + pan.x;
    const screenY = el.y * (zoom / 100) + pan.y;
    const screenWidth = el.width * (zoom / 100);
    const screenHeight = el.height * (zoom / 100);

    if (el.url) {
         // Generated state
         const topToolbarTop = screenY - 60;
         const centerX = screenX + (screenWidth / 2);
         return (
             <div className="absolute bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50 px-2 py-1.5 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 duration-200 -translate-x-1/2 whitespace-nowrap backdrop-blur-sm" style={{ left: centerX, top: topToolbarTop }} onMouseDown={(e) => e.stopPropagation()}>
                 <button className="px-2.5 py-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors group">
                    <div className="border-[1.5px] border-current rounded-[3px] px-0.5 text-[8px] font-bold opacity-70 group-hover:opacity-100 transition-opacity">HD</div> 
                    放大
                 </button>
                 <button className="px-2.5 py-1.5 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors group">
                    <div className="relative"><Eraser size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" /><div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-white border border-gray-600 rounded-full"></div></div> 
                    移除背景
                 </button>
                 <div className="w-px h-4 bg-gray-200 mx-1"></div>
                 <a href={el.url} download={`video-${el.id}.mp4`} className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition-colors" target="_blank" rel="noreferrer">
                    <Download size={16} strokeWidth={2} />
                 </a>
             </div>
         );
    } else {
        // Config state
        const toolbarTop = screenY + screenHeight + 16;
        const centerX = screenX + (screenWidth / 2);
        return (
            <div className="absolute bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-200 -translate-x-1/2 w-[420px]" style={{ left: centerX, top: toolbarTop }} onMouseDown={(e) => e.stopPropagation()}>
                 <textarea placeholder="描述你想要生成的视频..." className="w-full text-sm font-medium text-gray-700 placeholder:text-gray-400 bg-transparent border-none outline-none resize-none h-12 mb-2 p-1" value={el.genPrompt || ''} onChange={(e) => updateSelectedElement({ genPrompt: e.target.value })} onKeyDown={(e) => e.stopPropagation()} />
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="relative">
                            <button onClick={() => setShowModelPicker(!showModelPicker)} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-black transition"><Box size={14} /><span>{el.genModel || 'Veo 3.1 Fast'}</span><ChevronDown size={10} /></button>
                            {showModelPicker && (
                                <div className="absolute bottom-full mb-2 left-0 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 grid grid-cols-1 gap-1">
                                    {['Veo 3.1', 'Veo 3.1 Fast'].map(m => (<button key={m} onClick={() => { updateSelectedElement({ genModel: m as any }); setShowModelPicker(false); }} className="text-left px-2 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-medium">{m}</button>))}
                                </div>
                            )}
                         </div>
                         
                         <div className="flex gap-1">
                             <div className="relative group/tooltip">
                                <button className={`text-gray-400 hover:text-gray-600 transition flex items-center gap-1 text-[10px] p-1 rounded ${el.genStartFrame ? 'text-blue-500 bg-blue-50' : ''}`} onClick={() => document.getElementById(`start-frame-${el.id}`)?.click()}>
                                    <ImageIcon size={14} /> Start
                                </button>
                                <input type="file" id={`start-frame-${el.id}`} className="hidden" accept="image/*" onChange={(e) => handleVideoRefUpload(e, 'start')} />
                             </div>
                             
                             <div className="relative group/tooltip">
                                <button className={`text-gray-400 hover:text-gray-600 transition flex items-center gap-1 text-[10px] p-1 rounded ${el.genEndFrame ? 'text-blue-500 bg-blue-50' : ''}`} onClick={() => document.getElementById(`end-frame-${el.id}`)?.click()}>
                                    <ImageIcon size={14} /> End
                                </button>
                                <input type="file" id={`end-frame-${el.id}`} className="hidden" accept="image/*" onChange={(e) => handleVideoRefUpload(e, 'end')} />
                             </div>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setShowRatioPicker(!showRatioPicker); setShowResPicker(false); setShowModelPicker(false); }} className="text-xs font-medium text-gray-500 hover:text-black flex items-center gap-0.5">{el.genAspectRatio || '16:9'} <ChevronDown size={10} /></button>
                            {showRatioPicker && (
                                <div className="absolute bottom-full mb-2 right-0 w-32 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 flex flex-col gap-0.5">
                                    <div className="px-3 py-2 text-xs text-gray-400 font-medium">比例</div>
                                    {VIDEO_RATIOS.map(ar => (
                                        <button key={ar.value} onClick={() => { updateSelectedElement({ genAspectRatio: ar.value }); setShowRatioPicker(false); }} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${el.genAspectRatio === ar.value ? 'bg-gray-100 text-black' : 'hover:bg-gray-50 text-gray-700'}`}>
                                            <span>{ar.label}</span>
                                            {(el.genAspectRatio || '16:9') === ar.value && <Check size={14} className="text-black" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>
                         <button onClick={() => handleGenVideo(el.id)} disabled={!el.genPrompt || el.isGenerating} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${!el.genPrompt || el.isGenerating ? 'bg-gray-200 text-gray-400' : 'bg-gray-300 hover:bg-black text-white'}`}>{el.isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} fill="currentColor" />}</button>
                     </div>
                 </div>
                 {(el.genStartFrame || el.genEndFrame) && (
                     <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 overflow-x-auto no-scrollbar">
                         {el.genStartFrame && (
                             <div className="relative group/frame shrink-0">
                                 <img src={el.genStartFrame} className="h-10 rounded border border-gray-200" title="Start Frame" />
                                 <div className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 cursor-pointer hover:bg-red-500" onClick={() => updateSelectedElement({ genStartFrame: undefined })}><X size={8} /></div>
                                 <span className="absolute bottom-0 left-0 bg-black/50 text-white text-[8px] px-1 rounded-bl-sm rounded-tr-sm">Start</span>
                             </div>
                         )}
                         {el.genEndFrame && (
                             <div className="relative group/frame shrink-0">
                                 <img src={el.genEndFrame} className="h-10 rounded border border-gray-200" title="End Frame" />
                                 <div className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 cursor-pointer hover:bg-red-500" onClick={() => updateSelectedElement({ genEndFrame: undefined })}><X size={8} /></div>
                                 <span className="absolute bottom-0 left-0 bg-black/50 text-white text-[8px] px-1 rounded-bl-sm rounded-tr-sm">End</span>
                             </div>
                         )}
                     </div>
                 )}
            </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9FAFB] font-sans">
      {renderContextMenu()}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-10 cursor-pointer backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewUrl(null)}>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-white/10 rounded-full transition"><X size={24} /></button>
            <img src={previewUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      <AnimatePresence>
        {showLayersPanel && (
          <motion.div 
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -20, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute bottom-4 left-4 z-50 flex flex-col ${isLayersCollapsed ? 'w-auto' : 'w-64 max-h-[60vh] bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden'}`}
          >
            {isLayersCollapsed ? (
                <button onClick={() => setIsLayersCollapsed(false)} className="bg-white/90 backdrop-blur-md border border-white/20 shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 hover:scale-105 transition active:scale-95 group">
                    <History size={16} className="text-gray-600 group-hover:text-black" /><span className="text-sm font-medium text-gray-700 group-hover:text-black">Layers & History</span><ChevronRight size={16} className="text-gray-400 group-hover:text-black ml-1" />
                </button>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-transparent sticky top-0 z-10"><span className="font-semibold text-gray-900">历史记录</span><button onClick={() => setIsLayersCollapsed(true)} className="text-gray-400 hover:text-black transition"><ChevronDown size={16} /></button></div>
                    <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-2">
                        <div className="h-32 bg-gray-50/50 rounded-lg flex flex-col items-center justify-center text-gray-400 text-xs border border-dashed border-gray-200 mb-4"><div className="mb-2"><ImageIcon size={32} className="opacity-10"/></div>暂无历史记录</div>
                        <div className="border-t border-gray-100/50 pt-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">图层</h3>
                            <div className="space-y-1">
                                <motion.div whileHover={{ scale: 1.02 }} onClick={addText} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-sm text-gray-500 hover:bg-black/5 hover:text-black transition group border border-dashed border-gray-200 hover:border-gray-300 justify-center mb-2"><Plus size={14} /> Add Layer</motion.div>
                                {[...elements].reverse().map(el => (
                                    <motion.div layoutId={el.id} key={el.id} onClick={(e) => handleElementMouseDown(e, el.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer text-sm transition group border border-transparent ${selectedElementId === el.id ? 'bg-blue-50 border-blue-100' : 'hover:bg-black/5 hover:border-transparent'}`}>
                                        <div className="w-10 h-10 bg-white rounded-md border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">{el.type === 'text' && <span className="font-serif text-gray-500 text-lg">T</span>}{el.type === 'image' && <img src={el.url} className="w-full h-full object-cover" />}{(el.type === 'video' || el.type === 'gen-video') && <Video size={16} className="text-gray-500" />}{el.type === 'shape' && <Box size={16} className="text-gray-500"/>}{el.type === 'gen-image' && <ImagePlus size={16} className="text-blue-500"/>}</div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center"><div className="truncate text-gray-700 font-medium text-xs leading-tight mb-0.5">{el.type === 'text' ? (el.text || 'Text Layer') : (el.type === 'gen-image' ? 'Image Generator' : (el.type === 'gen-video' ? 'Video Generator' : (el.type === 'image' ? `Image ${el.id.slice(-4)}` : (el.type === 'shape' ? `${el.shapeType || 'Shape'}` : 'Element'))))}</div><div className="truncate text-gray-400 text-[10px]">{el.type === 'text' ? 'Text' : (el.type === 'gen-image' ? 'AI Model' : (el.type === 'gen-video' ? 'AI Video' : 'Graphic'))}</div></div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-2 border-t border-gray-100/50"><button onClick={() => setIsLayersCollapsed(true)} className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-black hover:bg-black/5 rounded-lg transition" title="Collapse Panel"><Minimize2 size={16} /></button></div>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssistant && (
            <motion.div 
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-4 right-4 w-[400px] bottom-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-40 flex flex-col overflow-hidden"
            >
                {/* Header with Toolbar */}
                <div className="pl-5 pr-3 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-20 shrink-0 select-none">
                    <div className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity cursor-default">
                        <div className="w-7 h-7 bg-black rounded-lg shadow-sm flex items-center justify-center text-white font-bold text-[10px] tracking-wider">XC</div>
                        <span className="font-bold text-sm text-gray-800 tracking-tight">Xc-STUDIO</span>
                    </div>
                    <div className="flex items-center gap-0.5 relative">
                        {/* 1. New Chat */}
                        <button 
                            onClick={() => { setMessages([]); setPrompt(''); }} 
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all group relative" 
                            title="New Chat"
                        >
                            <CirclePlus size={16} strokeWidth={1.5} />
                        </button>

                        {/* 2. History Popover */}
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowHistoryPopover(!showHistoryPopover); }} 
                                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${showHistoryPopover ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`} 
                                title="History"
                            >
                                <Clock size={16} strokeWidth={2} />
                            </button>
                            {/* Popover Content */}
                            {showHistoryPopover && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 history-popover-content text-left">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">历史对话</h4>
                                    <div className="relative mb-3">
                                        <input 
                                            placeholder="请输入搜索关键词" 
                                            className="w-full bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-gray-200 transition" 
                                        />
                                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="p-2 py-3 bg-gray-100/80 rounded-lg text-sm text-gray-500 hover:bg-gray-100 cursor-pointer transition text-center font-medium">
                                            新对话
                                        </div>
                                        {/* Mock History Items */}
                                        {/* <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                                            <div className="text-xs font-medium text-gray-700 truncate">Marketing Plan V1</div>
                                            <div className="text-[10px] text-gray-400 text-right mt-1">2 mins ago</div>
                                        </div> */}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Share */}
                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all" title="Share">
                            <Share2 size={16} strokeWidth={1.5} />
                        </button>

                        {/* 4. File List Popover */}
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowFileListModal(!showFileListModal); }}
                                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${showFileListModal ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`} 
                                title="Files"
                            >
                                <FileIcon size={16} strokeWidth={1.5} />
                            </button>
                            {/* Popover Content (Inline) */}
                            {showFileListModal && (
                                <div className="absolute top-full right-0 mt-2 w-[320px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                    {/* Header */}
                                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                                        <h3 className="font-bold text-gray-900 text-sm">已生成文件列表</h3>
                                        {/* No close button needed for popover usually, clicking outside closes it (handled by global click listener), but can keep toggle */}
                                    </div>
                                    {/* Content - Empty State */}
                                    <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 gap-3 relative">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-1">
                                            <div className="relative scale-75">
                                                <div className="w-10 h-10 border-2 border-gray-200 rounded-lg transform rotate-[-6deg] bg-white"></div>
                                                <div className="w-10 h-10 border-2 border-gray-300 rounded-lg bg-gray-100 absolute top-0 left-0"></div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400">暂无文件</span>
                                        
                                        {/* Decorative Sparkle (Subtler) */}
                                        <div className="absolute top-1/2 right-8 pointer-events-none opacity-40">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Divider */}
                        <div className="w-px h-4 bg-gray-200 mx-1.5 opacity-60"></div>
                        
                        {/* 5. Collapse */}
                        <button onClick={() => setShowAssistant(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all" title="Collapse">
                            <PanelRightClose size={16} strokeWidth={1.5} />
                        </button>

                        {/* File List Modal (Global/Portal style but inline for now within this relative container context, usually would be portal but sticking to simple z-index overlay here) */}

                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar relative">
                    {messages.length === 0 ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">试试这些 XC-STUDIO Skills</h3>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                我们将行业最佳实践封装为Skills，只需输入简单的需求，即刻实现专业产出。
                            </p>
                            
                            <div className="flex flex-col gap-6 w-full">
                                <button onClick={() => setPrompt("Amazon Product Listing Kit")} className="flex items-center gap-3 text-left group transition hover:translate-x-1">
                                    <Store size={20} className="text-pink-500" />
                                    <span className="text-gray-700 font-medium text-sm group-hover:text-black">Amazon Product Listing Kit</span>
                                </button>
                                <button onClick={() => setPrompt("Logo & Brand Design")} className="flex items-center gap-3 text-left group transition hover:translate-x-1">
                                    <Layout size={20} className="text-orange-400" />
                                    <span className="text-gray-700 font-medium text-sm group-hover:text-black">Logo & Brand Design</span>
                                </button>
                                <button onClick={() => setPrompt("Marketing Brochures")} className="flex items-center gap-3 text-left group transition hover:translate-x-1">
                                    <FileText size={20} className="text-lime-500" />
                                    <span className="text-gray-700 font-medium text-sm group-hover:text-black">Marketing Brochures</span>
                                </button>
                                <button onClick={() => setPrompt("Social Media Visual Assets")} className="flex items-center gap-3 text-left group transition hover:translate-x-1">
                                    <ImageIcon size={20} className="text-blue-500" />
                                    <span className="text-gray-700 font-medium text-sm group-hover:text-black">Social Media Visual Assets</span>
                                </button>
                                <button onClick={() => setPrompt("Narrative Storyboards")} className="flex items-center gap-3 text-left group transition hover:translate-x-1">
                                    <Copy size={20} className="text-teal-500" />
                                    <span className="text-gray-700 font-medium text-sm group-hover:text-black">Narrative Storyboards</span>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="space-y-4 pb-4">
                            {messages.map(msg => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'model' && currentTask && (
                                        <AgentAvatar agentId={currentTask.agentId} size="sm" />
                                    )}
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                                        {msg.text}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {msg.attachments.map((att, i) => (
                                                    <div key={i} className="relative group/att">
                                                        <img src={att} className="rounded-lg border border-gray-200" />
                                                        {msg.relatedMarkerId && (
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                                                                {msg.relatedMarkerId}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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

                            {/* Agent Task Progress */}
                            {currentTask && (currentTask.status === 'analyzing' || currentTask.status === 'executing') && (
                                <TaskProgress task={currentTask} />
                            )}

                            {/* Proposal Selector */}
                            {currentTask?.output?.proposals && currentTask.output.proposals.length > 0 && (
                                <div className="mt-4">
                                    <ProposalSelector
                                        proposals={currentTask.output.proposals}
                                        onSelect={async (proposal: AgentProposal) => {
                                            setIsTyping(true);
                                            try {
                                                const task: AgentTask = {
                                                    id: `task-${Date.now()}`,
                                                    agentId: currentTask.agentId,
                                                    status: 'executing',
                                                    input: {
                                                        message: `Execute proposal: ${proposal.id}`,
                                                        context: projectContext
                                                    },
                                                    createdAt: Date.now(),
                                                    updatedAt: Date.now()
                                                };

                                                const result = await executeAgentTask(task);

                                                if (result.output?.assets) {
                                                    result.output.assets.forEach(asset => {
                                                        if (asset.type === 'image') {
                                                            const newElement: CanvasElement = {
                                                                id: `gen-${Date.now()}-${Math.random()}`,
                                                                type: 'gen-image',
                                                                url: asset.url,
                                                                x: 100,
                                                                y: 100,
                                                                width: 400,
                                                                height: 400,
                                                                zIndex: elements.length,
                                                                genPrompt: asset.metadata.prompt,
                                                                genModel: asset.metadata.model as any
                                                            };
                                                            setElements((prev: CanvasElement[]) => [...prev, newElement]);
                                                        }
                                                    });
                                                }

                                                if (result.output?.message) {
                                                    setMessages((prev: ChatMessage[]) => [...prev, {
                                                        id: `msg-${Date.now()}`,
                                                        role: 'model',
                                                        text: result.output.message,
                                                        timestamp: Date.now()
                                                    }]);
                                                }
                                            } catch (error) {
                                                console.error('Proposal execution error:', error);
                                            } finally {
                                                setIsTyping(false);
                                            }
                                        }}
                                        isExecuting={isTyping}
                                    />
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>



                {/* Input Area */}
                <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-gray-100/50 z-20">
                    <div className="bg-white rounded-[24px] border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 relative group focus-within:ring-2 focus-within:ring-black/5 focus-within:border-gray-300 flex flex-col">
                        
                        {/* Text Input Area (Block Based) */}
                        <div className="px-3 py-3 flex flex-wrap items-center gap-1.5 min-h-[48px] cursor-text" onClick={() => {
                            // Focus the active block or last block
                            const lastId = inputBlocks[inputBlocks.length - 1].id;
                            const el = document.getElementById(`input-block-${activeBlockId}`) || document.getElementById(`input-block-${lastId}`);
                            el?.focus();
                        }}>
                            {inputBlocks.map((block, i) => {
                                if (block.type === 'file' && block.file) {
                                    // Render Chip
                                    const file = block.file;
                                    const markerId = (file as any).markerId;
                                    if (markerId) {
                                        return (
                                            <div key={block.id} className="flex items-center gap-1 bg-[#F3F4F6] rounded-full pl-1 pr-3 py-1 cursor-default relative group flex-shrink-0 select-none">
                                                <div className="w-6 h-6 bg-gray-900 rounded-full overflow-hidden border border-gray-200">
                                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover"/>
                                                </div>
                                                <div className="w-4 h-4 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm -ml-2 border border-white z-10">{markerId}</div>
                                                <span className="text-xs text-gray-700 font-medium ml-1">区域</span>
                                                <button onClick={(e) => { e.stopPropagation(); removeInputBlock(block.id); }} className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-sm z-20"><X size={8} /></button>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={block.id} className="relative flex items-center gap-2 bg-[#F3F4F6] rounded-lg pl-1 pr-2 py-1 flex-shrink-0 select-none">
                                                <div className="w-6 h-6 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                                                    {file.type.startsWith('image/') ? <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" /> : <FileText size={12} className="text-gray-500" />}
                                                </div>
                                                <span className="text-xs text-gray-600 max-w-[60px] truncate">{file.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); removeInputBlock(block.id); }} className="bg-gray-300 text-gray-600 rounded-full p-0.5 hover:bg-gray-400 hover:text-white transition"><X size={8} /></button>
                                            </div>
                                        );
                                    }
                                } else {
                                    // Render Input Text
                                    return (
                                        <input
                                            key={block.id}
                                            id={`input-block-${block.id}`}
                                            value={block.text}
                                            onChange={(e) => setInputBlocks(prev => prev.map(b => b.id === block.id ? { ...b, text: e.target.value } : b))}
                                            onFocus={() => setActiveBlockId(block.id)}
                                            onSelect={(e) => setSelectionIndex(e.currentTarget.selectionStart)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !block.text) {
                                                     // If empty and backspace, maybe remove previous block if it is a file?
                                                     // e.preventDefault(); // Don't prevent default, let it process? 
                                                     // Actually we need to handle manual removal
                                                     const myIndex = inputBlocks.findIndex(b => b.id === block.id);
                                                     if (myIndex > 0) {
                                                         const prevBlock = inputBlocks[myIndex - 1];
                                                         if (prevBlock.type === 'file') {
                                                             removeInputBlock(prevBlock.id);
                                                             e.preventDefault(); // Prevent deleting char from prev block if it somehow merged?
                                                         }
                                                     }
                                                }
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                if (e.clipboardData.files.length > 0) {
                                                    e.preventDefault();
                                                    Array.from(e.clipboardData.files).forEach(f => insertInputFile(f as File));
                                                }
                                            }}
                                            className={`bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 ${
                                                // 最后一个文本块，且（有内容或是唯一块）时才 flex-grow
                                                i === inputBlocks.length - 1 && block.type === 'text' && (block.text || inputBlocks.length === 1)
                                                    ? 'flex-grow min-w-[150px]'
                                                    : block.text 
                                                        ? 'min-w-[20px]' 
                                                        : 'min-w-[10px]'
                                            }`}
                                            style={
                                                i === inputBlocks.length - 1 && block.type === 'text' && (block.text || inputBlocks.length === 1)
                                                    ? {} 
                                                    : block.text
                                                        ? { width: `${Math.max(20, (block.text || '').split('').reduce((acc, char) => acc + (char.charCodeAt(0) > 255 ? 16 : 9), 0) + 20)}px` }
                                                        : { width: '10px' }
                                            }
                                            placeholder={i === 0 && inputBlocks.length === 1 ? "Type a message..." : ""}
                                            autoComplete="off"
                                        />
                                    );
                                }
                            })}
                        </div>

                        <div className="p-1 px-2 flex items-center justify-between border-t border-transparent">
                            <div className="flex items-center gap-1">
                                <button onClick={() => {
                                    console.log('Paperclip button clicked!');
                                    console.log('fileInputRef.current:', fileInputRef.current);
                                    fileInputRef.current?.click();
                                }} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-black/5 transition"><Paperclip size={18} /></button>
                                <button
                                    onClick={() => {
                                        const newMode = !agentMode;
                                        console.log('[Agent Button] Toggling agent mode to:', newMode);
                                        setAgentMode(newMode);
                                    }}
                                    className={`h-8 px-3 rounded-full border flex items-center gap-1.5 text-xs font-medium transition mx-1 ${agentMode ? 'bg-blue-50 border-[#3B82F6] text-[#3B82F6]' : 'bg-transparent border-blue-200 text-blue-500 hover:bg-blue-50'}`}
                                >
                                    <Sparkles size={12} />
                                    {currentTask && currentTask.status !== 'completed' ? `${getAgentInfo(currentTask.agentId).name} Working...` : 'Agent'}
                                </button>
                                {agentMode && currentTask && (
                                    <div className="ml-2">
                                        <AgentSelector
                                            currentAgent={currentTask.agentId}
                                            onSelect={(agentId: AgentType) => console.log('Agent selected:', agentId)}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Right Icons */}
                            <div className="flex items-center gap-1">
                                <div className="h-8 bg-gray-50/80 rounded-full flex items-center p-0.5 px-2 gap-2 border border-gray-100">
                                    <button onClick={() => setModelMode('thinking')} className={`text-gray-500 hover:text-black transition`} title="Thinking Mode"><Lightbulb size={16} strokeWidth={2} /></button>
                                    <div className="w-px h-3 bg-gray-300"></div>
                                    <button onClick={() => setModelMode('fast')} className={`text-gray-500 hover:text-black transition`} title="Fast Mode"><Zap size={16} strokeWidth={2} /></button>
                                </div>
                                <button onClick={() => setWebEnabled(!webEnabled)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${webEnabled ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-black/5 bg-white'}`}><Globe size={16} strokeWidth={1.5} /></button>
                                <button onClick={() => setImageModelEnabled(!imageModelEnabled)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${imageModelEnabled ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-black/5 bg-white'}`}><Box size={16} strokeWidth={2} /></button>
                                <button onClick={() => handleSend()} disabled={inputBlocks.every(b => (b.type === 'text' && !b.text) || (b.type === 'file' && !b.file))} className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm ${(inputBlocks.every(b => (b.type === 'text' && !b.text) || (b.type === 'file' && !b.file))) ? 'bg-gray-200 text-gray-400' : 'bg-black text-white hover:scale-105'}`}><ArrowUp size={16} strokeWidth={2.5} /></button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Hidden file input for selecting files */}
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => {
                        console.log('File input onChange triggered!', e.target.files);
                        if (e.target.files) {
                            console.log('Files selected:', e.target.files.length);
                            Array.from(e.target.files).forEach((f: File, idx: number) => {
                                console.log(`Processing file ${idx + 1}:`, f.name, f.type, f.size);
                                insertInputFile(f as File);
                            });
                        }
                        if (fileInputRef.current) {
                            console.log('Clearing file input value');
                            fileInputRef.current.value = '';
                        }
                    }}
                />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30 pointer-events-none transition-all duration-300" style={{ paddingRight: showAssistant ? '420px' : '0' }}>
              <div className="flex items-center gap-3 pointer-events-auto transition-all duration-300 ml-12">
                 <button onClick={() => navigate('/')} className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md hover:scale-105 transition">XC</button>
                 <div className="flex items-center gap-2 cursor-pointer hover:bg-white/50 px-3 py-1.5 rounded-full transition backdrop-blur-sm pointer-events-auto">
                    <input className="font-medium text-gray-900 bg-transparent border-none focus:outline-none w-24 focus:w-48 transition-all" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
                    <ChevronDown size={14} className="text-gray-500" />
                 </div>
              </div>
              
              {/* Top Right Floating Controls - Zoom & Toggle */}
              <div className="pointer-events-auto flex items-center gap-2">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 flex items-center p-1 gap-1 h-9">
                     <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition"><Minus size={14} /></button>
                     <span className="text-xs font-medium w-8 text-center text-gray-700">{Math.round(zoom)}%</span>
                     <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition"><Plus size={14} /></button>
                 </div>
                 
                 {!showAssistant && (
                   <button onClick={() => setShowAssistant(true)} className="w-9 h-9 bg-white rounded-xl shadow-sm border border-gray-200/80 flex items-center justify-center text-black hover:bg-gray-50 transition">
                      <Sparkles size={16} fill="currentColor" />
                   </button>
                 )}
              </div>
          </div>

          <div ref={containerRef} className="flex-1 overflow-hidden relative bg-[#F9FAFB] cursor-crosshair w-full h-full" onContextMenu={handleContextMenu} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: (activeTool === 'hand' || isPanning || isSpacePressed) ? (isPanning ? 'grabbing' : 'grab') : (activeTool === 'mark' ? 'crosshair' : 'default') }}>
             {renderToolbar()}
             {renderTextToolbar()}
             {renderShapeToolbar()}
             {renderImageToolbar()}
             {renderGenVideoToolbar()}
             <div className="absolute top-0 left-0 w-0 h-0 overflow-visible transition-transform duration-75 ease-out" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`, transformOrigin: '0 0' }}>
                {elements.map((el) => {
                    const isSelected = selectedElementId === el.id;
                    return (
                        <div key={el.id} className={`absolute group ${isSelected && el.type !== 'text' ? 'ring-2 ring-blue-500' : ''} ${isSelected && el.type === 'text' ? 'ring-1 ring-blue-500 ring-offset-2' : ''}`} style={{ left: el.x, top: el.y, width: el.type === 'text' ? 'auto' : el.width, height: el.type === 'text' ? 'auto' : el.height, zIndex: el.zIndex, cursor: activeTool === 'select' ? 'move' : (activeTool === 'mark' ? 'crosshair' : 'default'), whiteSpace: el.type === 'text' ? 'nowrap' : 'normal' }} onMouseDown={(e) => handleElementMouseDown(e, el.id)} onDoubleClick={() => { if (el.type === 'text') { setEditingTextId(el.id); } else if (el.url) { setPreviewUrl(el.url); } }}>
                             {(isSelected || isDraggingElement) && editingTextId !== el.id && (<div className="absolute -top-8 right-0 bg-white shadow-md rounded-md p-1 cursor-pointer hover:bg-red-50 hover:text-red-500 z-50"><Trash2 size={14} onClick={(e) => { e.stopPropagation(); deleteSelectedElement(); }} /></div>)}
                             {/* ... (rest of element rendering remains same) ... */}
                             {el.type === 'shape' && (
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
                                    {el.shapeType === 'square' && (<rect x="0" y="0" width="100" height="100" rx={el.cornerRadius ? (el.cornerRadius / Math.min(el.width, el.height)) * 100 : 0} fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeColor === 'transparent' ? 0 : (el.strokeWidth || 2)} vectorEffect="non-scaling-stroke" />)}
                                    {el.shapeType === 'circle' && (<circle cx="50" cy="50" r="50" fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeColor === 'transparent' ? 0 : (el.strokeWidth || 2)} vectorEffect="non-scaling-stroke" />)}
                                    {el.shapeType === 'triangle' && (<polygon points="50,0 100,100 0,100" fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeColor === 'transparent' ? 0 : (el.strokeWidth || 2)} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
                                    {el.shapeType === 'star' && (<polygon points="50 2 61 35 98 35 68 57 79 91 50 70 21 91 32 57 2 35 39 35" fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeColor === 'transparent' ? 0 : (el.strokeWidth || 2)} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
                                    {el.shapeType === 'arrow-right' && (<polygon points="0,30 60,30 60,10 100,50 60,90 60,70 0,70" fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeColor === 'transparent' ? 0 : (el.strokeWidth || 2)} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
                                    {el.shapeType === 'arrow-left' && (<polygon points="100,30 40,30 40,10 0,50 40,90 40,70 100,70" fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeColor === 'transparent' ? 0 : (el.strokeWidth || 2)} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
                                    {el.shapeType === 'bubble' && (<path d="M10,10 Q90,10 90,50 Q90,90 50,90 L30,100 L40,85 Q10,80 10,50 Q10,10 50,10" fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeColor === 'transparent' ? 0 : (el.strokeWidth || 2)} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
                                </svg>
                             )}
                             {(el.type === 'image' || el.type === 'gen-image') && (
                                 <div className={`w-full h-full flex flex-col relative transition-all ${el.url && el.type === 'image' ? '' : (el.url ? 'bg-white' : 'bg-[#F0F9FF]')} ${isSelected ? 'ring-1 ring-blue-500' : (el.type === 'gen-image' && !el.url ? 'border border-blue-100' : '')} ${el.type === 'gen-image' ? 'rounded-lg overflow-hidden' : ''}`}> 
                                     {el.url ? (
                                        <>
                                            <img src={el.url} className={`w-full h-full ${el.type === 'image' ? 'w-full h-full' : 'object-cover'}`} draggable={false} />
                                            {/* Resize Handles - Only for Image & Selected */}
                                            {isSelected && (
                                                <>
                                                    <div className="absolute top-0 left-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-20 cursor-nw-resize hover:scale-125 transition" onMouseDown={(e) => handleResizeStart(e, 'nw', el.id)}></div>
                                                    <div className="absolute top-0 right-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full translate-x-1/2 -translate-y-1/2 z-20 cursor-ne-resize hover:scale-125 transition" onMouseDown={(e) => handleResizeStart(e, 'ne', el.id)}></div>
                                                    <div className="absolute bottom-0 left-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full -translate-x-1/2 translate-y-1/2 z-20 cursor-sw-resize hover:scale-125 transition" onMouseDown={(e) => handleResizeStart(e, 'sw', el.id)}></div>
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full translate-x-1/2 translate-y-1/2 z-20 cursor-se-resize hover:scale-125 transition" onMouseDown={(e) => handleResizeStart(e, 'se', el.id)}></div>
                                                    {/* Side Handles */}
                                                    <div className="absolute top-1/2 left-0 w-1.5 h-6 bg-white border border-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-20 cursor-ew-resize hover:scale-110 transition hidden group-hover:block" onMouseDown={(e) => handleResizeStart(e, 'w', el.id)}></div>
                                                    <div className="absolute top-1/2 right-0 w-1.5 h-6 bg-white border border-blue-500 rounded-full translate-x-1/2 -translate-y-1/2 z-20 cursor-ew-resize hover:scale-110 transition hidden group-hover:block" onMouseDown={(e) => handleResizeStart(e, 'e', el.id)}></div>
                                                    {/* Top Selection Info Bar (Clean Text Style) */}
                                                    {/* Left: Name */}
                                                    <div 
                                                        className="absolute top-0 left-0 flex items-center gap-1.5 text-xs font-semibold text-gray-700 whitespace-nowrap pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity delay-75 duration-200 origin-bottom-left z-50"
                                                        style={{ 
                                                            transform: `scale(${100 / zoom}) translateY(calc(-100% - 4px))`
                                                        }}
                                                    >
                                                        <ImageIcon size={12} className="opacity-80" />
                                                        <span>{el.id.includes('unnamed') ? 'unnamed' : 'Image'}</span>
                                                    </div>

                                                    {/* Right: Dimensions */}
                                                    <div 
                                                        className="absolute top-0 right-0 font-mono text-[10px] font-medium text-gray-500 whitespace-nowrap pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity delay-75 duration-200 origin-bottom-right z-50"
                                                        style={{ 
                                                            transform: `scale(${100 / zoom}) translateY(calc(-100% - 6px))`
                                                        }}
                                                    >
                                                        {Math.round(el.width)} × {Math.round(el.height)}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                     ) : (
                                        <>
                                            <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 border-b border-blue-100/50 whitespace-nowrap"><div className="flex items-center gap-2 font-medium"> <ImageIcon size={12} /> <span>Image...</span> </div><div className="font-mono opacity-70"> {Math.round(el.width)} × {Math.round(el.height)} </div></div> 
                                            <div className="flex-1 flex items-center justify-center relative group-hover:bg-blue-50/50 transition-colors"> 
                                                {el.isGenerating ? (<div className="flex flex-col items-center gap-3"> <Loader2 size={32} className="animate-spin text-blue-500" /> <span className="text-xs text-blue-400 font-medium">Creating magic...</span> </div>) : (<div className="flex flex-col items-center gap-2 text-blue-200"> <ImageIcon size={48} strokeWidth={1.5} /> </div>)} 
                                                {el.genRefImage && !el.url && (<div className="absolute bottom-3 right-3 w-12 h-12 border-2 border-white shadow-sm rounded-lg overflow-hidden bg-gray-100"> <img src={el.genRefImage} className="w-full h-full object-cover opacity-80" /> </div>)} 
                                            </div>
                                        </>
                                     )}
                                 </div>
                             )}
                             {(el.type === 'gen-video' || el.type === 'video') && (
                                <div className={`w-full h-full flex flex-col relative transition-all ${el.url ? 'bg-black' : 'bg-[#F0FAFF]'} ${isSelected ? 'ring-1 ring-blue-500' : ((el.type === 'gen-video' || el.type === 'video') && !el.url ? 'border border-blue-100' : '')} ${(el.type === 'gen-video' || el.type === 'video') ? 'rounded-lg overflow-hidden' : ''}`}> 
                                    {el.url ? (
                                        <>
                                            <div className="w-full h-full relative flex items-center justify-center">
                                                <video src={el.url} className="w-full h-full object-contain" controls />
                                            </div>
                                            {/* Resize Handles - Only for Selected */}
                                            {isSelected && (
                                                <>
                                                    <div className="absolute top-0 left-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-20 cursor-nw-resize hover:scale-125 transition" onMouseDown={(e) => handleResizeStart(e, 'nw', el.id)}></div>
                                                    <div className="absolute top-0 right-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full translate-x-1/2 -translate-y-1/2 z-20 cursor-ne-resize hover:scale-125 transition" onMouseDown={(e) => handleResizeStart(e, 'ne', el.id)}></div>
                                                    <div className="absolute bottom-0 left-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full -translate-x-1/2 translate-y-1/2 z-20 cursor-sw-resize hover:scale-125 transition" onMouseDown={(e) => handleResizeStart(e, 'sw', el.id)}></div>
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full translate-x-1/2 translate-y-1/2 z-20 cursor-se-resize hover:scale-125 transition" onMouseDown={(e) => handleResizeStart(e, 'se', el.id)}></div>
                                                    {/* Side Handles */}
                                                    <div className="absolute top-1/2 left-0 w-1.5 h-6 bg-white border border-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-20 cursor-ew-resize hover:scale-110 transition hidden group-hover:block" onMouseDown={(e) => handleResizeStart(e, 'w', el.id)}></div>
                                                    <div className="absolute top-1/2 right-0 w-1.5 h-6 bg-white border border-blue-500 rounded-full translate-x-1/2 -translate-y-1/2 z-20 cursor-ew-resize hover:scale-110 transition hidden group-hover:block" onMouseDown={(e) => handleResizeStart(e, 'e', el.id)}></div>
                                                    
                                                    {/* Top Selection Info Bar (Counter-Scaled) */}
                                                    {/* Left: Name */}
                                                    <div 
                                                        className="absolute top-0 left-0 flex items-center gap-1.5 text-xs font-semibold text-gray-700 whitespace-nowrap pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity delay-75 duration-200 origin-bottom-left z-50 mix-blend-difference text-white"
                                                        style={{ 
                                                            transform: `scale(${100 / zoom}) translateY(calc(-100% - 4px))`
                                                        }}
                                                    >
                                                        <Video size={12} className="opacity-80" />
                                                        <span>Video</span>
                                                    </div>

                                                    {/* Right: Dimensions */}
                                                    <div 
                                                        className="absolute top-0 right-0 font-mono text-[10px] font-medium text-gray-500 whitespace-nowrap pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity delay-75 duration-200 origin-bottom-right z-50 mix-blend-difference text-white"
                                                        style={{ 
                                                            transform: `scale(${100 / zoom}) translateY(calc(-100% - 6px))`
                                                        }}
                                                    >
                                                        {Math.round(el.width)} × {Math.round(el.height)}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 border-b border-blue-100/50 whitespace-nowrap"><div className="flex items-center gap-2 font-medium"> <Video size={12} /> <span>Video...</span> </div><div className="font-mono opacity-70"> {Math.round(el.width)} × {Math.round(el.height)} </div></div>
                                            <div className="flex-1 flex items-center justify-center relative group-hover:bg-blue-50/50 transition-colors">
                                                {el.isGenerating ? (<div className="flex flex-col items-center gap-3"> <Loader2 size={32} className="animate-spin text-blue-500" /> <span className="text-xs text-blue-400 font-medium">Creating magic...</span> </div>) : (<div className="flex flex-col items-center gap-2 text-blue-200"> <Film size={48} strokeWidth={1.5} /> </div>)}
                                            </div>
                                        </>
                                    )}
                                </div>
                             )}
                        </div>
                    );
                })}
                {/* Markers Layer */}
                {markers.map((marker) => {
                    const el = elements.find(e => e.id === marker.elementId);
                    if (!el) return null;
                    const pixelX = el.x + (el.width * marker.x / 100);
                    const pixelY = el.y + (el.height * marker.y / 100);
                    
                    return (
                        <div key={marker.id} style={{ left: pixelX, top: pixelY }} className="absolute z-50 group/marker -translate-x-1/2 -translate-y-full pb-1 cursor-default">
                             <div className="relative">
                                 <div className="w-8 h-8 rounded-full bg-[#3B82F6] border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm relative z-10">
                                     {marker.id}
                                 </div>
                                 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#3B82F6]"></div>
                             </div>
                             
                             <div className="absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition pointer-events-none flex flex-col gap-1 z-50">
                                 <span className="text-xs font-bold text-gray-800">快捷编辑 <span className="text-[10px] font-normal text-gray-400 border border-gray-200 rounded px-1 ml-1">Tab</span></span>
                             </div>
                        </div>
                    )
                })}
             </div>
          </div>
      </div>


    </div>
  );
};

export default Workspace;
