import { AIError, AIErrorType, AIProvider } from '../../types/ai';
// import { ChatMessage } from '../../types/chat';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface NetworkStatus {
  isOnline: boolean;
  lastCheck: number;
  checkInterval: number;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };
  private networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    lastCheck: Date.now(),
    checkInterval: 5000
  };

  private constructor() {
    this.setupNetworkMonitoring();
  }

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  private setupNetworkMonitoring(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.networkStatus.isOnline = true;
      this.networkStatus.lastCheck = Date.now();
    });

    window.addEventListener('offline', () => {
      this.networkStatus.isOnline = false;
      this.networkStatus.lastCheck = Date.now();
    });
  }

  async checkNetworkConnectivity(): Promise<boolean> {
    const now = Date.now();

    // Use cached status if recent
    if (now - this.networkStatus.lastCheck < this.networkStatus.checkInterval) {
      return this.networkStatus.isOnline;
    }

    try {
      // Test connectivity with a simple fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.networkStatus.isOnline = true;
    } catch {
      this.networkStatus.isOnline = false;
    }

    this.networkStatus.lastCheck = now;
    return this.networkStatus.isOnline;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof AIError) {
      return error.type === AIErrorType.NETWORK_ERROR ||
        error.type === AIErrorType.RATE_LIMIT_ERROR ||
        error.type === AIErrorType.API_ERROR;
    }

    // Check for common network/temporary errors
    const errorMessage = error?.message?.toLowerCase() || '';
    const retryablePatterns = [
      'network error',
      'timeout',
      'connection',
      'rate limit',
      'too many requests',
      'service unavailable',
      'internal server error',
      'bad gateway',
      'gateway timeout'
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Check network connectivity before attempting
        if (!(await this.checkNetworkConnectivity())) {
          throw new AIError(
            AIErrorType.NETWORK_ERROR,
            'No network connectivity available'
          );
        }

        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on the last attempt or non-retryable errors
        if (attempt === this.retryConfig.maxRetries || !this.isRetryableError(error)) {
          break;
        }

        const delay = this.calculateBackoffDelay(attempt);
        console.warn(`${context} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms:`, error);

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackProviders: AIProvider[],
    operationType: 'chat' | 'summary',
    operationData: any
  ): Promise<{ result: T; usedProvider?: string }> {
    // Try primary operation first
    try {
      const result = await this.executeWithRetry(primaryOperation, 'primary provider');
      return { result };
    } catch (primaryError) {
      console.warn('Primary provider failed, attempting fallback:', primaryError);

      // Try fallback providers
      for (const provider of fallbackProviders) {
        if (!provider.isConfigured()) {
          continue;
        }

        try {
          let result: T;

          if (operationType === 'chat') {
            const { messages, onChunk } = operationData;
            if (typeof provider.generateResponseWithHistory === 'function') {
              const responseStream = await this.executeWithRetry(
                () => provider.generateResponseWithHistory(messages, { stream: !!onChunk }),
                `fallback provider ${provider.name}`
              );

              let fullResponse = '';
              for await (const chunk of responseStream) {
                fullResponse += chunk;
                if (onChunk) onChunk(chunk);
              }
              result = fullResponse as T;
            } else {
              // Fallback to single message
              const lastMessage = messages[messages.length - 1];
              if (!lastMessage || lastMessage.role !== 'user') {
                continue;
              }

              const responseStream = await this.executeWithRetry(
                () => provider.generateResponse(lastMessage.content, {
                  systemPrompt: "You are Delight, a helpful AI assistant.",
                  stream: !!onChunk
                }),
                `fallback provider ${provider.name}`
              );

              let fullResponse = '';
              for await (const chunk of responseStream) {
                fullResponse += chunk;
                if (onChunk) onChunk(chunk);
              }
              result = fullResponse as T;
            }
          } else if (operationType === 'summary') {
            const { content, length } = operationData;
            result = await this.executeWithRetry(
              () => provider.generateSummary(content, length),
              `fallback provider ${provider.name}`
            ) as T;
          } else {
            continue;
          }

          console.log(`Successfully used fallback provider: ${provider.name}`);
          return { result, usedProvider: provider.name };
        } catch (fallbackError) {
          console.warn(`Fallback provider ${provider.name} failed:`, fallbackError);
          continue;
        }
      }

      // All providers failed
      throw new AIError(
        AIErrorType.API_ERROR,
        'All providers failed. Please check your network connection and API keys.',
        undefined,
        primaryError instanceof Error ? primaryError : undefined
      );
    }
  }

  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
}