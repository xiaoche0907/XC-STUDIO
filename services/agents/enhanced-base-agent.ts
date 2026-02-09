/**
 * 增强型基础智能体
 * 使用Skills系统统一处理任务，提供完善的错误处理和状态管理
 */

import { Chat, Type } from '@google/genai';
import { createChatSession } from '../gemini';
import {
    AgentTask,
    AgentInfo,
    ProjectContext,
    GeneratedAsset
} from '../../types/agent.types';
import { executeSkill, AVAILABLE_SKILLS } from '../skills';
import { errorHandler, ErrorType, AppError } from '../../utils/error-handler';

/**
 * 任务执行配置
 */
interface ExecutionConfig {
    maxRetries: number;
    timeout: number;
    enableCache: boolean;
}

const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
    maxRetries: 2,
    timeout: 60000,
    enableCache: true
};

export abstract class EnhancedBaseAgent {
    protected chat: Chat | null = null;
    protected executionCache: Map<string, any> = new Map();

    abstract get agentInfo(): AgentInfo;
    abstract get systemPrompt(): string;
    abstract get preferredSkills(): string[]; // 智能体偏好的技能

    /**
     * 初始化智能体
     */
    async initialize(context: ProjectContext): Promise<void> {
        try {
            this.chat = createChatSession(
                'gemini-3-pro-preview',
                [],
                this.systemPrompt
            );
            console.log(`[${this.agentInfo.id}] Initialized successfully`);
        } catch (error) {
            throw errorHandler.handleError(error, {
                agent: this.agentInfo.id,
                function: 'initialize'
            });
        }
    }

    /**
     * 执行任务（核心方法）
     */
    async execute(
        task: AgentTask,
        config: Partial<ExecutionConfig> = {}
    ): Promise<AgentTask> {
        const finalConfig = { ...DEFAULT_EXECUTION_CONFIG, ...config };
        const taskId = task.id;

        try {
            console.log(`[${this.agentInfo.id}] Starting task execution:`, taskId);

            // 更新任务状态
            task = this.updateTaskStatus(task, 'analyzing');

            // 验证输入
            this.validateInput(task);

            // 检查缓存
            if (finalConfig.enableCache) {
                const cached = this.getCachedResult(task);
                if (cached) {
                    console.log(`[${this.agentInfo.id}] Using cached result`);
                    return this.updateTaskStatus(cached, 'completed');
                }
            }

            // 使用错误处理包装器执行
            const result = await errorHandler.withRetry(
                () => this.executeWithTimeout(task, finalConfig.timeout),
                {
                    maxRetries: finalConfig.maxRetries,
                    delay: 2000,
                    backoff: true,
                    context: {
                        agent: this.agentInfo.id,
                        taskId,
                        taskType: task.input.message.substring(0, 50)
                    }
                }
            );

            // 缓存结果
            if (finalConfig.enableCache && result.status === 'completed') {
                this.cacheResult(task, result);
            }

            console.log(`[${this.agentInfo.id}] Task completed:`, taskId);
            return result;
        } catch (error) {
            const appError = error as AppError;
            console.error(`[${this.agentInfo.id}] Task failed:`, appError.message);

            return {
                ...task,
                status: 'failed',
                output: {
                    message: `执行失败: ${appError.message}`,
                    error: appError
                },
                updatedAt: Date.now()
            };
        }
    }

    /**
     * 带超时的执行
     */
    private async executeWithTimeout(
        task: AgentTask,
        timeout: number
    ): Promise<AgentTask> {
        return Promise.race([
            this.executeInternal(task),
            new Promise<AgentTask>((_, reject) =>
                setTimeout(
                    () => reject(
                        errorHandler.createError(
                            ErrorType.AGENT,
                            '任务执行超时',
                            undefined,
                            { taskId: task.id, timeout },
                            true
                        )
                    ),
                    timeout
                )
            )
        ]);
    }

    /**
     * 内部执行逻辑（使用Skills）
     */
    private async executeInternal(task: AgentTask): Promise<AgentTask> {
        const { message, context } = task.input;

        // 1. 分析任务并生成执行计划
        const plan = await this.analyzeAndPlan(message, context);

        // 2. 如果有建议方案，返回供用户选择
        if (plan.proposals && plan.proposals.length > 0) {
            return {
                ...task,
                status: 'completed',
                output: {
                    message: plan.analysis || '我为您准备了以下方案',
                    analysis: plan.analysis,
                    proposals: plan.proposals
                },
                updatedAt: Date.now()
            };
        }

        // 3. 执行Skills
        const skillResults = await this.executeSkills(plan.skillCalls || []);

        // 4. 提取生成的资产
        const assets = this.extractAssets(skillResults);

        // 5. 组装最终输出
        return {
            ...task,
            status: 'completed',
            output: {
                message: plan.message || plan.concept || '任务已完成',
                assets,
                skillCalls: skillResults
            },
            updatedAt: Date.now()
        };
    }

    /**
     * 分析任务并制定执行计划
     */
    private async analyzeAndPlan(
        message: string,
        context: ProjectContext
    ): Promise<any> {
        try {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY
            });

            const fullPrompt = `${this.systemPrompt}

Project Context:
- Title: ${context.projectTitle}
- Brand: ${JSON.stringify(context.brandInfo || {})}
- Existing Assets: ${context.existingAssets.length}

Available Skills: ${this.preferredSkills.join(', ')}

User Request: ${message}

Analyze the request and respond with JSON containing:
{
  "analysis": "Brief analysis",
  "proposals": [{"id": "...", "title": "...", "description": "...", "skillCalls": [...]}],
  "skillCalls": [{"skillName": "...", "params": {...}}],
  "message": "Response message",
  "concept": "Creative concept"
}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: [{ text: fullPrompt }] },
                config: {
                    temperature: 0.7,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            analysis: { type: Type.STRING },
                            proposals: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING }
                                    }
                                }
                            },
                            skillCalls: { type: Type.ARRAY },
                            message: { type: Type.STRING },
                            concept: { type: Type.STRING }
                        }
                    }
                }
            });

            return this.parseResponse(response.text || '{}');
        } catch (error) {
            throw errorHandler.handleError(error, {
                agent: this.agentInfo.id,
                function: 'analyzeAndPlan'
            });
        }
    }

    /**
     * 执行Skills（带完善错误处理）
     */
    protected async executeSkills(skillCalls: any[]): Promise<any[]> {
        const results: any[] = [];

        for (const call of skillCalls) {
            try {
                // 验证技能存在
                if (!AVAILABLE_SKILLS[call.skillName as keyof typeof AVAILABLE_SKILLS]) {
                    throw new Error(`Skill ${call.skillName} not found`);
                }

                const result = await executeSkill(call.skillName, call.params);
                results.push({ ...call, result, success: true });
            } catch (error) {
                const appError = errorHandler.handleError(error, {
                    skill: call.skillName,
                    agent: this.agentInfo.id
                });
                results.push({
                    ...call,
                    error: appError.message,
                    success: false
                });
            }
        }

        return results;
    }

    /**
     * 从技能结果中提取资产
     */
    protected extractAssets(skillCalls: any[]): GeneratedAsset[] {
        return skillCalls
            .filter(s => s.success && s.result && (
                s.skillName === 'generateImage' ||
                s.skillName === 'generateVideo'
            ))
            .map(s => ({
                id: `asset-${Date.now()}-${Math.random()}`,
                type: s.skillName === 'generateImage' ? 'image' as const : 'video' as const,
                url: s.result,
                metadata: {
                    prompt: s.params.prompt,
                    model: s.params.model,
                    agentId: this.agentInfo.id
                }
            }));
    }

    /**
     * 解析响应
     */
    protected parseResponse(response: string): any {
        try {
            // 移除markdown代码块
            let cleaned = response.trim();
            const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (codeBlockMatch) {
                cleaned = codeBlockMatch[1].trim();
            }

            return JSON.parse(cleaned);
        } catch (error) {
            console.warn('[Agent] JSON parse failed, using fallback');
            return { message: response, skillCalls: [] };
        }
    }

    /**
     * 输入验证
     */
    private validateInput(task: AgentTask): void {
        if (!task.input.message || !task.input.message.trim()) {
            throw errorHandler.createError(
                ErrorType.VALIDATION,
                '任务消息不能为空',
                undefined,
                { taskId: task.id },
                false
            );
        }

        if (!task.input.context) {
            throw errorHandler.createError(
                ErrorType.VALIDATION,
                '任务上下文缺失',
                undefined,
                { taskId: task.id },
                false
            );
        }
    }

    /**
     * 更新任务状态
     */
    private updateTaskStatus(task: AgentTask, status: AgentTask['status']): AgentTask {
        return {
            ...task,
            status,
            updatedAt: Date.now()
        };
    }

    /**
     * 缓存结果
     */
    private cacheResult(task: AgentTask, result: AgentTask): void {
        const key = this.getCacheKey(task);
        this.executionCache.set(key, result);
    }

    /**
     * 获取缓存结果
     */
    private getCachedResult(task: AgentTask): AgentTask | null {
        const key = this.getCacheKey(task);
        return this.executionCache.get(key) || null;
    }

    /**
     * 生成缓存键
     */
    private getCacheKey(task: AgentTask): string {
        return `${this.agentInfo.id}:${task.input.message}`;
    }

    /**
     * 重置智能体
     */
    reset(): void {
        this.chat = null;
        this.executionCache.clear();
    }
}
