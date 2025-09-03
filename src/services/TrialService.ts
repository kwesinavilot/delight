export class TrialService {
  private static readonly TRIAL_KEY = 'AIzaSyBANEciLK9kOAuFy_shhAsVgWn5PMKt1oo';
  private static readonly TRIAL_LIMIT = 5;
  private static readonly STORAGE_KEY = 'trialUsage';

  static async getTrialUsage(): Promise<number> {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      return result[this.STORAGE_KEY] || 0;
    } catch (error) {
      console.error('Failed to get trial usage:', error);
      return 0;
    }
  }

  static async incrementTrialUsage(): Promise<number> {
    try {
      const currentUsage = await this.getTrialUsage();
      const newUsage = currentUsage + 1;
      await chrome.storage.local.set({ [this.STORAGE_KEY]: newUsage });
      return newUsage;
    } catch (error) {
      console.error('Failed to increment trial usage:', error);
      return this.TRIAL_LIMIT; // Fail safe
    }
  }

  static async isTrialAvailable(): Promise<boolean> {
    const usage = await this.getTrialUsage();
    return usage < this.TRIAL_LIMIT;
  }

  static async getRemainingTrialRequests(): Promise<number> {
    const usage = await this.getTrialUsage();
    return Math.max(0, this.TRIAL_LIMIT - usage);
  }

  static getTrialApiKey(): string {
    return this.TRIAL_KEY;
  }

  static async clearTrialData(): Promise<void> {
    try {
      await chrome.storage.local.remove([this.STORAGE_KEY]);
    } catch (error) {
      console.error('Failed to clear trial data:', error);
    }
  }

  static async shouldUseTrialMode(): Promise<boolean> {
    // Check if user has configured any API keys
    try {
      const result = await chrome.storage.sync.get(['aiSettings']);
      const settings = result.aiSettings;
      
      if (!settings) return true; // No settings = use trial
      
      // Check if any provider has a user-configured key
      const providers = ['openai', 'anthropic', 'gemini', 'grok', 'groq', 'sambanova'];
      const hasUserKey = providers.some(provider => 
        settings[provider]?.apiKey && settings[provider].apiKey.trim() !== ''
      );
      
      if (hasUserKey) {
        // User has their own key, clear trial data
        await this.clearTrialData();
        return false;
      }
      
      // No user keys, check if trial is still available
      return await this.isTrialAvailable();
    } catch (error) {
      console.error('Failed to check trial mode:', error);
      return false;
    }
  }
}