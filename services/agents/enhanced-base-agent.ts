/**
 * 增强型基础智能体
 * 使用Skills系统统一处理任务，提供完善的错误处理和状态管理
 */

import { Chat, Type } from '@google/genai';
import { createChatSession, getApiKey, getClient } from '../gemini';
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
    timeout: 300000,
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
        const plan = await this.analyzeAndPlan(message, context, task.input.attachments);

        console.log(`[${this.agentInfo.id}] Plan received:`, {
            hasProposals: !!(plan.proposals && plan.proposals.length),
            proposalCount: plan.proposals?.length || 0,
            hasSkillCalls: !!(plan.skillCalls && plan.skillCalls.length),
            skillCallCount: plan.skillCalls?.length || 0,
            proposalSkillCalls: plan.proposals?.map((p: any) => p.skillCalls?.length || 0)
        });

        // 2. 检测用户是否请求了多张图
        const multiImageMatch = message.match(/(\d+)\s*张|(\d+)\s*images?|一套|一组|系列/i);
        const requestedCount = multiImageMatch ? (parseInt(multiImageMatch[1] || multiImageMatch[2]) || 5) : 0;

        // 3. 如果有 proposals 且 proposals 内含 skillCalls，自动执行
        let effectiveProposals = plan.proposals && plan.proposals.length > 0 ? plan.proposals : [];

        // 4. 如果 proposals 为空或 proposals 内没有 skillCalls，但顶层有 skillCalls，尝试修复
        const proposalsHaveSkills = effectiveProposals.some((p: any) => p.skillCalls && p.skillCalls.length > 0);

        if (!proposalsHaveSkills && plan.skillCalls && plan.skillCalls.length > 0) {
            console.log(`[${this.agentInfo.id}] Proposals missing skillCalls, restructuring from top-level skillCalls`);

            if (requestedCount > 1 && plan.skillCalls.length === 1) {
                // 用户要求多张图但只有1个 skillCall — 需要基于原始 prompt 生成多个变体
                const baseCall = plan.skillCalls[0];
                const basePrompt = baseCall.params?.prompt || '';
                const ecommerceVariants = [
                    { title: '产品信息图', suffix: ', clean white background, product infographic with feature callout annotations, e-commerce listing style, professional, 8K' },
                    { title: '多角度展示', suffix: ', studio product photography, 3/4 angle view, even soft lighting, commercial quality, white gradient background, 8K' },
                    { title: '场景应用图', suffix: ', lifestyle photography, product in natural real-use setting, warm natural lighting, editorial quality, aspirational, 8K' },
                    { title: '细节特写图', suffix: ', macro product photography, extreme close-up of texture and material detail, sharp focus, studio lighting, premium quality, 8K' },
                    { title: '尺寸包装图', suffix: ', product with size reference objects, flat lay composition, what-is-in-the-box layout, clean informative style, 8K' },
                ];

                effectiveProposals = [];
                for (let i = 0; i < requestedCount && i < ecommerceVariants.length; i++) {
                    effectiveProposals.push({
                        id: String(i + 1),
                        title: ecommerceVariants[i].title,
                        description: ecommerceVariants[i].title,
                        skillCalls: [{
                            skillName: 'generateImage',
                            params: {
                                prompt: basePrompt + ecommerceVariants[i].suffix,
                                aspectRatio: baseCall.params?.aspectRatio || '1:1',
                                model: baseCall.params?.model || 'Nano Banana Pro'
                            }
                        }]
                    });
                }
                console.log(`[${this.agentInfo.id}] Created ${effectiveProposals.length} variant proposals from single skillCall`);
            } else {
                // 将每个顶层装成一个 proposal
                effectiveProposals = plan.skillCalls.map((call: any, idx: number) => ({
                    id: String(idx + 1),
                    title: `方案 ${idx + 1}`,
                    description: call.params?.prompt?.substring(0, 80) || '',
                    skillCalls: [call]
                }));
            }
        }

        // 5. 执行所有 proposals 的 skillCalls
        if (effectiveProposals.length > 0) {
            const generatedAssets: GeneratedAsset[] = [];

            for (const proposal of effectiveProposals) {
                if (proposal.skillCalls && Array.isArray(proposal.skillCalls)) {
                    console.log(`[${this.agentInfo.id}] Executing proposal "${proposal.title}" with ${proposal.skillCalls.length} skill calls`);
                    const results = await this.executeSkills(proposal.skillCalls, task);
                    const assets = this.extractAssets(results);
                    generatedAssets.push(...assets);
                    if (assets.length > 0) {
                        proposal.generatedUrl = assets[0].url;
                    }
                }
            }

            console.log(`[${this.agentInfo.id}] Total generated assets: ${generatedAssets.length}`);

            return {
                ...task,
                status: 'completed',
                output: {
                    message: plan.analysis || '已为您生成设计方案',
                    analysis: plan.analysis,
                    proposals: effectiveProposals,
                    assets: generatedAssets,
                    adjustments: ['调整构图', '更换风格', '修改配色', '添加文字', '放大画质']
                },
                updatedAt: Date.now()
            };
        }

        // 6. Fallback: 执行顶层 Skills（无 proposals 的情况）
        const skillResults = await this.executeSkills(plan.skillCalls || [], task);

        // 7. 提取生成的资产
        const assets = this.extractAssets(skillResults);

        // 8. 组装最终输出
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
        context: ProjectContext,
        attachments?: File[]
    ): Promise<any> {
        try {
            const ai = getClient();

            const fullPrompt = `${this.systemPrompt}

【语言要求】你必须用中文回复所有内容（analysis、message、title、description 等字段全部用中文）。只有 prompt 字段用英文（因为图片生成模型需要英文 prompt）。

项目信息:
- 项目名称: ${context.projectTitle}
- 品牌信息: ${JSON.stringify(context.brandInfo || {})}
- 已有素材数量: ${context.existingAssets.length}

附件列表:
${(attachments || []).map((file, index) => {
                const info = (file as any).markerInfo;
                if (info) {
                    const ratio = (info.width / info.height).toFixed(2);
                    return `- 附件 ${index + 1}: [画布选区] (尺寸: ${info.width}x${info.height}, 比例: ${ratio})。这是用户的产品图片，必须作为参考图使用。设置 referenceImage 为 'ATTACHMENT_${index}'。`;
                }
                return `- 附件 ${index + 1}: ${file.name} (${file.type})。引用方式: 'ATTACHMENT_${index}'`;
            }).join('\n')}

可用技能: ${this.preferredSkills.join(', ')}

特殊技能 smartEdit（图片编辑）:
- 删除物体: editType='object-remove', parameters: {"object": "目标名称"}
- 去除背景: editType='background-remove'
- 更换颜色: editType='recolor', parameters: {"object": "目标", "color": "颜色"}
- 替换物体: editType='replace', parameters: {"object": "原物体", "replacement": "新物体"}
- 放大画质: editType='upscale'
- sourceUrl 设为 "ATTACHMENT_X"

用户请求: ${message}

【产品识别 - 最高优先级】
- 如果用户附带了图片（附件），这些图片就是用户的产品/素材。你必须仔细观察每张图片，识别出产品的具体类型、颜色、材质、形状、品牌元素等细节。
- 在每个 generateImage 的 prompt 中，必须以产品的精确英文描述开头（例如 "A matte black stainless steel water bottle with bamboo lid and minimalist logo" 而不是 "a water bottle"）。
- 所有生成的图片必须围绕这些具体产品，不能生成无关的随机产品。
- 如果没有附件图片，根据用户的文字描述来理解产品。
- 重要：每个 generateImage 的 params 中必须包含 "referenceImage": "ATTACHMENT_N"（N 是附件索引，从0开始）。如果只有1张附件，所有 proposal 都用 "ATTACHMENT_0"；如果有多张附件，每个 proposal 可以引用不同的附件（如 ATTACHMENT_0, ATTACHMENT_1, ATTACHMENT_2...）。

【任务拆解规则】
- 如果用户要求多张图（如"5张副图"、"一套图"、"3张海报"），必须返回对应数量的 proposals，每个 proposal 的内容/角度/用途各不相同。
- 每个 proposal 必须包含自己的 skillCalls 数组。
- 电商套图（亚马逊副图）应包含：白底主图、信息图、场景图、细节特写、尺寸包装图等。
- 不能返回少于用户要求数量的 proposals。

请分析用户需求，返回以下 JSON 格式:
{
  "analysis": "用中文简要分析用户需求",
  "proposals": [{"id": "1", "title": "中文标题", "description": "中文描述", "skillCalls": [{"skillName": "generateImage", "params": {"prompt": "English prompt describing the EXACT product...", "referenceImage": "ATTACHMENT_0", "aspectRatio": "1:1", "model": "Nano Banana Pro"}}]}],
  "skillCalls": [{"skillName": "...", "params": {...}}],
  "message": "用中文回复用户",
  "concept": "用中文描述创意概念"
}`;

            // Build content parts - text + image attachments for visual understanding
            const parts: any[] = [{ text: fullPrompt }];

            // Add image attachments so Gemini can SEE the product
            if (attachments && attachments.length > 0) {
                for (const file of attachments) {
                    try {
                        if (file.type && file.type.startsWith('image/')) {
                            const buffer = await file.arrayBuffer();
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                            parts.push({
                                inlineData: {
                                    mimeType: file.type || 'image/png',
                                    data: base64
                                }
                            });
                        }
                    } catch (e) {
                        console.warn(`[${this.agentInfo.id}] Failed to attach file:`, e);
                    }
                }
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts },
                config: {
                    temperature: 0.7,
                    responseMimeType: 'application/json'
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
    protected async executeSkills(skillCalls: any[], task: AgentTask): Promise<any[]> {
        const results: any[] = [];

        // Skill name alias mapping (Gemini may return old-style names)
        const SKILL_ALIASES: Record<string, string> = {
            'imageGenSkill': 'generateImage',
            'videoGenSkill': 'generateVideo',
            'copyGenSkill': 'generateCopy',
            'textExtractSkill': 'extractText',
            'regionAnalyzeSkill': 'analyzeRegion',
            'smartEditSkill': 'smartEdit',
            'exportSkill': 'export',
            'touchEditSkill': 'touchEdit',
        };

        for (const call of skillCalls) {
            try {
                // Normalize skill name via alias
                if (SKILL_ALIASES[call.skillName]) {
                    call.skillName = SKILL_ALIASES[call.skillName];
                }

                // 验证技能存在
                if (!AVAILABLE_SKILLS[call.skillName as keyof typeof AVAILABLE_SKILLS]) {
                    throw new Error(`Skill ${call.skillName} not found`);
                }

                // 解析 attachment引用
                if (call.skillName === 'generateImage' || call.skillName === 'generateVideo' || call.skillName === 'smartEdit') {
                    // Check for referenceImage (gen) or sourceUrl (edit)
                    const paramKey = call.skillName === 'smartEdit' ? 'sourceUrl' : 'referenceImage';

                    // 自动注入产品参考图：如果有附件但 Gemini 没设置 referenceImage，自动注入
                    if (call.skillName === 'generateImage' && !call.params[paramKey] && task.input.attachments && task.input.attachments.length > 0) {
                        const imageAttachments = task.input.attachments.filter(f => f.type && f.type.startsWith('image/'));
                        if (imageAttachments.length > 0) {
                            // 如果只有一张图，所有 proposal 都用它；多张图时按 proposal 索引分配
                            const callIndex = skillCalls.indexOf(call);
                            const attachIdx = imageAttachments.length === 1 ? 0 : Math.min(callIndex, imageAttachments.length - 1);
                            const actualIdx = task.input.attachments.indexOf(imageAttachments[attachIdx]);
                            call.params[paramKey] = `ATTACHMENT_${actualIdx}`;
                            console.log(`[${this.agentInfo.id}] Auto-injected referenceImage=ATTACHMENT_${actualIdx} for proposal #${callIndex}`);
                        }
                    }

                    if (call.params[paramKey] && typeof call.params[paramKey] === 'string' && call.params[paramKey].startsWith('ATTACHMENT_')) {
                        const index = parseInt(call.params[paramKey].split('_')[1]);
                        const availableAttachments = task.input.attachments || [];
                        if (availableAttachments[index]) {
                            const file = availableAttachments[index];
                            const reader = new FileReader();
                            const base64 = await new Promise<string>((resolve) => {
                                reader.onload = () => {
                                    const res = reader.result as string;
                                    resolve(res);
                                };
                                reader.readAsDataURL(file);
                            });
                            call.params[paramKey] = base64;

                            // For smartEdit, inject aspect ratio if available
                            if (call.skillName === 'smartEdit' && (file as any).markerInfo) {
                                const info = (file as any).markerInfo;
                                // Simple ratio mapping
                                const ratio = info.width / info.height;
                                let aspect = '1:1';
                                if (ratio > 1.5) aspect = '16:9';
                                else if (ratio < 0.7) aspect = '9:16';
                                else if (ratio > 1.2) aspect = '4:3';
                                else if (ratio < 0.8) aspect = '3:4';

                                call.params.aspectRatio = aspect;
                            }
                        }
                    }
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
