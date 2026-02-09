import { useState, useCallback, useRef } from 'react';
import { AgentType, AgentTask, ProjectContext, GeneratedAsset } from '../types/agent.types';
import { routeToAgent, executeAgentTask, getAgentInfo } from '../services/agents';
import { ChatMessage, CanvasElement } from '../types';
import { assetsToCanvasElementsAtCenter } from '../utils/canvas-helpers';

interface AgentMessage extends ChatMessage {
  agentId?: AgentType;
  taskId?: string;
  assets?: GeneratedAsset[];
}

interface CanvasState {
  elements: CanvasElement[];
  pan: { x: number; y: number };
  zoom: number;
  showAssistant: boolean;
}

interface UseAgentOrchestratorOptions {
  projectContext: ProjectContext;
  canvasState?: CanvasState;
  onElementsUpdate?: (elements: CanvasElement[]) => void;
  onHistorySave?: (elements: CanvasElement[], markers: any[]) => void;
  autoAddToCanvas?: boolean;
}

/**
 * 增强版智能体编排Hook
 * 
 * 新功能:
 * - 自动将生成的资产添加到画布
 * - 智能居中放置
 * - 完整的生命周期管理
 * - 错误处理和重试
 * 
 * @example
 * const { processMessage, currentTask } = useAgentOrchestrator({
 *   projectContext,
 *   canvasState: { elements, pan, zoom, showAssistant },
 *   onElementsUpdate: setElements,
 *   onHistorySave: saveToHistory,
 *   autoAddToCanvas: true
 * });
 */
export function useAgentOrchestrator(options: UseAgentOrchestratorOptions) {
  const {
    projectContext,
    canvasState,
    onElementsUpdate,
    onHistorySave,
    autoAddToCanvas = true
  } = options;

  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const conversationHistory = useRef<ChatMessage[]>([]);

  /**
   * 自动添加资产到画布
   */
  const addAssetsToCanvas = useCallback((assets: GeneratedAsset[]) => {
    if (!canvasState || !onElementsUpdate || !autoAddToCanvas) {
      console.log('[useAgentOrchestrator] Canvas integration disabled or not configured');
      return;
    }

    try {
      const containerW = window.innerWidth - (canvasState.showAssistant ? 400 : 0);
      const containerH = window.innerHeight;

      console.log('[useAgentOrchestrator] Adding', assets.length, 'assets to canvas');

      const newElements = assetsToCanvasElementsAtCenter(
        assets,
        containerW,
        containerH,
        canvasState.pan,
        canvasState.zoom,
        canvasState.elements.length
      );

      console.log('[useAgentOrchestrator] Created', newElements.length, 'canvas elements');

      const updatedElements = [...canvasState.elements, ...newElements];
      onElementsUpdate(updatedElements);

      // 保存到历史
      if (onHistorySave) {
        onHistorySave(updatedElements, []);
      }

      console.log('[useAgentOrchestrator] Canvas updated successfully');
    } catch (error) {
      console.error('[useAgentOrchestrator] Failed to add assets to canvas:', error);
    }
  }, [canvasState, onElementsUpdate, onHistorySave, autoAddToCanvas]);

  /**
   * 处理用户消息并执行智能体任务
   */
  const processMessage = useCallback(async (
    message: string,
    attachments?: File[]
  ): Promise<AgentTask | null> => {
    if (!isAgentMode || !message.trim()) return null;

    try {
      console.log('[useAgentOrchestrator] Processing message:', message.substring(0, 50));

      // Update context with current conversation
      const updatedContext = {
        ...projectContext,
        conversationHistory: conversationHistory.current
      };

      // Route to appropriate agent
      console.log('[useAgentOrchestrator] Routing to agent...');
      const decision = await routeToAgent(message, updatedContext);

      if (!decision) {
        console.error('[useAgentOrchestrator] No routing decision returned');
        return null;
      }

      console.log('[useAgentOrchestrator] Routed to:', decision.targetAgent);

      // Create task
      const task: AgentTask = {
        id: `task-${Date.now()}`,
        agentId: decision.targetAgent,
        status: 'pending',
        input: {
          message,
          attachments,
          context: updatedContext
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setCurrentTask({ ...task, status: 'analyzing' });

      // Execute task
      console.log('[useAgentOrchestrator] Executing task...');
      const result = await executeAgentTask(task);
      console.log('[useAgentOrchestrator] Task result:', result.status);
      console.log('[useAgentOrchestrator] Has assets:', !!result.output?.assets);
      console.log('[useAgentOrchestrator] Has proposals:', !!result.output?.proposals);

      // 自动添加生成的资产到画布
      if (result.output?.assets && result.output.assets.length > 0) {
        console.log('[useAgentOrchestrator] Auto-adding assets to canvas...');
        addAssetsToCanvas(result.output.assets);
      }

      setCurrentTask(result);

      // Update conversation history
      conversationHistory.current.push({
        id: `msg-${Date.now()}`,
        role: 'user',
        text: message,
        timestamp: Date.now()
      });

      if (result.output?.message) {
        conversationHistory.current.push({
          id: `msg-${Date.now() + 1}`,
          role: 'model',
          text: result.output.message,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('[useAgentOrchestrator] Error:', error);
      setCurrentTask(null);
      return null;
    }
  }, [isAgentMode, projectContext, addAssetsToCanvas]);

  /**
   * 执行选中的Proposal
   */
  const executeProposal = useCallback(async (proposalId: string): Promise<void> => {
    if (!currentTask || !currentTask.output?.proposals) {
      console.error('[useAgentOrchestrator] No current task or proposals');
      return;
    }

    const proposal = currentTask.output.proposals.find(p => p.id === proposalId);
    if (!proposal) {
      console.error('[useAgentOrchestrator] Proposal not found:', proposalId);
      return;
    }

    try {
      console.log('[useAgentOrchestrator] Executing proposal:', proposal.title);

      setCurrentTask(prev => prev ? { ...prev, status: 'executing' } : null);

      const task: AgentTask = {
        id: `task-${Date.now()}`,
        agentId: currentTask.agentId,
        status: 'executing',
        input: {
          message: `Execute proposal: ${proposal.title}`,
          context: projectContext
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const result = await executeAgentTask(task);
      console.log('[useAgentOrchestrator] Proposal execution result:', result.status);

      // 自动添加生成的资产到画布
      if (result.output?.assets && result.output.assets.length > 0) {
        console.log('[useAgentOrchestrator] Auto-adding proposal assets to canvas...');
        addAssetsToCanvas(result.output.assets);
      }

      setCurrentTask(result);
    } catch (error) {
      console.error('[useAgentOrchestrator] Proposal execution error:', error);
      setCurrentTask(prev => prev ? { ...prev, status: 'failed' } : null);
      throw error;
    }
  }, [currentTask, projectContext, addAssetsToCanvas]);

  const resetAgent = useCallback(() => {
    setCurrentTask(null);
    conversationHistory.current = [];
  }, []);

  return {
    currentTask,
    isAgentMode,
    setIsAgentMode,
    processMessage,
    executeProposal,
    addAssetsToCanvas,
    resetAgent,
    messages
  };
}
