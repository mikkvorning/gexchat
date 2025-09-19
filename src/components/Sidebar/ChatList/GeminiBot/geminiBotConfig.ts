export interface GeminiBotConfig {
  id: string;
  displayName: string;
  description: string;
  searchTerms: string[];
  alwaysVisible: boolean;
  priority: number;
  avatar?: {
    text: string;
    backgroundColor: string;
    imageUrl: string;
  };
}

/**
 * In the future this configuration will likely be fetched from the user settings in the database
 */
export const GEMINI_BOT_CONFIG: GeminiBotConfig = {
  id: 'gemini-bot',
  displayName: 'Gemini-bot',
  description: 'Your AI assistant',
  searchTerms: ['gemini', 'bot', 'ai', 'assistant', 'google', 'help'],
  alwaysVisible: false,
  priority: 1,
  avatar: {
    text: 'G',
    backgroundColor: '#6C47FF',
    imageUrl: '',
  },
};
