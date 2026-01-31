import { useMemo } from 'react';
import { ProjectContext } from '../types/agent.types';
import { CanvasElement, ChatMessage } from '../types';

export function useProjectContext(
  projectId: string,
  projectTitle: string,
  elements: CanvasElement[],
  messages: ChatMessage[]
): ProjectContext {
  return useMemo(() => ({
    projectId,
    projectTitle,
    brandInfo: undefined,
    existingAssets: elements,
    conversationHistory: messages
  }), [projectId, projectTitle, elements, messages]);
}
