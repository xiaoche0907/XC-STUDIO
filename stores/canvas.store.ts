import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CanvasElement, Marker } from '../types';

interface CanvasState {
  // 视图状态
  zoom: number;
  pan: { x: number; y: number };
  
  // 元素状态
  elements: CanvasElement[];
  selectedElementId: string | null;
  editingTextId: string | null;
  
  // 标记系统
  markers: Marker[];
  
  // 历史记录
  history: Array<{ elements: CanvasElement[]; markers: Marker[] }>;
  historyStep: number;
  
  // 操作状态
  isDraggingElement: boolean;
  isPanning: boolean;
  isResizing: boolean;
  resizeHandle: string | null;
  
  // Actions
  actions: {
    // 视图操作
    setZoom: (zoom: number) => void;
    setPan: (pan: { x: number; y: number }) => void;
    
    // 元素操作
    addElement: (element: CanvasElement) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    deleteElement: (id: string) => void;
    setElements: (elements: CanvasElement[]) => void;
    
    // 选择操作
    setSelectedElementId: (id: string | null) => void;
    setEditingTextId: (id: string | null) => void;
    
    // 标记操作
    addMarker: (marker: Marker) => void;
    removeMarker: (id: number) => void;
    setMarkers: (markers: Marker[]) => void;
    
    // 历史操作
    saveToHistory: () => void;
    undo: () => void;
    redo: () => void;
    
    // 拖拽和缩放状态
    setIsDragging: (isDragging: boolean) => void;
    setIsPanning: (isPanning: boolean) => void;
    setIsResizing: (isResizing: boolean, handle?: string | null) => void;
    
    // 批量重置
    reset: () => void;
  };
}

const initialState = {
  zoom: 50,
  pan: { x: 0, y: 0 },
  elements: [],
  selectedElementId: null,
  editingTextId: null,
  markers: [],
  history: [{ elements: [], markers: [] }],
  historyStep: 0,
  isDraggingElement: false,
  isPanning: false,
  isResizing: false,
  resizeHandle: null,
};

export const useCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    ...initialState,
    
    actions: {
      setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),
      
      setPan: (pan) => set({ pan }),
      
      addElement: (element) => set((state) => {
        state.elements.push(element);
      }),
      
      updateElement: (id, updates) => set((state) => {
        const index = state.elements.findIndex(el => el.id === id);
        if (index !== -1) {
          state.elements[index] = { ...state.elements[index], ...updates };
        }
      }),
      
      deleteElement: (id) => set((state) => {
        state.elements = state.elements.filter(el => el.id !== id);
        state.markers = state.markers.filter(m => m.elementId !== id);
        if (state.selectedElementId === id) {
          state.selectedElementId = null;
        }
      }),
      
      setElements: (elements) => set({ elements }),
      
      setSelectedElementId: (id) => set({ selectedElementId: id }),
      
      setEditingTextId: (id) => set({ editingTextId: id }),
      
      addMarker: (marker) => set((state) => {
        state.markers.push(marker);
      }),
      
      removeMarker: (id) => set((state) => {
        state.markers = state.markers
          .filter(m => m.id !== id)
          .map((m, i) => ({ ...m, id: i + 1 }));
      }),
      
      setMarkers: (markers) => set({ markers }),
      
      saveToHistory: () => set((state) => {
        const newHistory = state.history.slice(0, state.historyStep + 1);
        newHistory.push({ 
          elements: JSON.parse(JSON.stringify(state.elements)),
          markers: JSON.parse(JSON.stringify(state.markers))
        });
        state.history = newHistory;
        state.historyStep = newHistory.length - 1;
      }),
      
      undo: () => set((state) => {
        if (state.historyStep > 0) {
          const prevStep = state.historyStep - 1;
          state.historyStep = prevStep;
          state.elements = state.history[prevStep].elements;
          state.markers = state.history[prevStep].markers;
        }
      }),
      
      redo: () => set((state) => {
        if (state.historyStep < state.history.length - 1) {
          const nextStep = state.historyStep + 1;
          state.historyStep = nextStep;
          state.elements = state.history[nextStep].elements;
          state.markers = state.history[nextStep].markers;
        }
      }),
      
      setIsDragging: (isDragging) => set({ isDraggingElement: isDragging }),
      
      setIsPanning: (isPanning) => set({ isPanning }),
      
      setIsResizing: (isResizing, handle = null) => set({ 
        isResizing, 
        resizeHandle: handle 
      }),
      
      reset: () => set(initialState),
    }
  }))
);
