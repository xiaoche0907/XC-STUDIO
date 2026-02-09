/**
 * 统一错误处理系统
 * 提供完善的错误分类、日志记录和用户友好提示
 */

export enum ErrorType {
    NETWORK = 'NETWORK',
    API = 'API',
    VALIDATION = 'VALIDATION',
    AGENT = 'AGENT',
    SKILL = 'SKILL',
    STORAGE = 'STORAGE',
    UNKNOWN = 'UNKNOWN'
}

export interface AppError {
    type: ErrorType;
    message: string;
    originalError?: Error;
    context?: Record<string, any>;
    timestamp: number;
    retryable: boolean;
}

class ErrorHandler {
    private errorLog: AppError[] = [];
    private maxLogSize = 100;

    /**
     * 创建应用错误
     */
    createError(
        type: ErrorType,
        message: string,
        originalError?: Error,
        context?: Record<string, any>,
        retryable: boolean = false
    ): AppError {
        const error: AppError = {
            type,
            message,
            originalError,
            context,
            timestamp: Date.now(),
            retryable
        };

        this.log(error);
        return error;
    }

    /**
     * 处理错误并返回用户友好的消息
     */
    handleError(error: unknown, context?: Record<string, any>): AppError {
        if (this.isAppError(error)) {
            return error;
        }

        if (error instanceof Error) {
            // 网络错误
            if (error.message.includes('fetch') || error.message.includes('network')) {
                return this.createError(
                    ErrorType.NETWORK,
                    '网络连接失败，请检查网络设置后重试',
                    error,
                    context,
                    true
                );
            }

            // API错误
            if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
                return this.createError(
                    ErrorType.API,
                    'API调用失败，请检查配置或稍后重试',
                    error,
                    context,
                    true
                );
            }

            // 验证错误
            if (error.message.includes('validate') || error.message.includes('invalid')) {
                return this.createError(
                    ErrorType.VALIDATION,
                    '输入数据验证失败，请检查输入',
                    error,
                    context,
                    false
                );
            }
        }

        // 未知错误
        return this.createError(
            ErrorType.UNKNOWN,
            '发生未知错误，请稍后重试',
            error instanceof Error ? error : undefined,
            context,
            true
        );
    }

    /**
     * 带重试的异步操作包装器
     */
    async withRetry<T>(
        operation: () => Promise<T>,
        options: {
            maxRetries?: number;
            delay?: number;
            backoff?: boolean;
            context?: Record<string, any>;
        } = {}
    ): Promise<T> {
        const { maxRetries = 3, delay = 1000, backoff = true, context } = options;
        let lastError: AppError | undefined;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = this.handleError(error, {
                    ...context,
                    attempt: attempt + 1,
                    maxRetries
                });

                if (!lastError.retryable || attempt === maxRetries) {
                    throw lastError;
                }

                const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        throw lastError;
    }

    /**
     * 记录错误
     */
    private log(error: AppError): void {
        this.errorLog.push(error);

        // 限制日志大小
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        // 控制台输出（开发环境）
        if (process.env.NODE_ENV === 'development') {
            console.error('[ErrorHandler]', {
                type: error.type,
                message: error.message,
                context: error.context,
                originalError: error.originalError
            });
        }
    }

    /**
     * 获取错误日志
     */
    getErrorLog(): AppError[] {
        return [...this.errorLog];
    }

    /**
     * 清除错误日志
     */
    clearErrorLog(): void {
        this.errorLog = [];
    }

    /**
     * 检查是否为应用错误
     */
    private isAppError(error: unknown): error is AppError {
        return (
            typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'message' in error &&
            'timestamp' in error
        );
    }
}

export const errorHandler = new ErrorHandler();

/**
 * 错误边界组件使用的错误处理Hook
 */
export function getErrorMessage(error: AppError): string {
    const messages: Record<ErrorType, string> = {
        [ErrorType.NETWORK]: '🌐 ' + error.message,
        [ErrorType.API]: '🔌 ' + error.message,
        [ErrorType.VALIDATION]: '⚠️ ' + error.message,
        [ErrorType.AGENT]: '🤖 ' + error.message,
        [ErrorType.SKILL]: '⚡ ' + error.message,
        [ErrorType.STORAGE]: '💾 ' + error.message,
        [ErrorType.UNKNOWN]: '❌ ' + error.message
    };

    return messages[error.type] || error.message;
}
