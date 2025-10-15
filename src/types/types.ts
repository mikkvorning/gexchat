/**
 * Basic user info available to all users
 */
export interface BaseUser {
  id: string;
  displayName: string;
  username: string; // Lowercase version for case-insensitive searches
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
}

/**
 * Currently logged in user
 */
export interface CurrentUser extends BaseUser {
  email: string;
  createdAt: Date;

  // User's active chats
  chats: string[]; // Array of chat IDs the user participates in

  // User blocking (independent of friend status)
  blocked: string[]; // Array of user IDs who are blocked

  // Simple privacy settings
  privacy: {
    showStatus: boolean;
    showLastSeen: boolean;
    showActivity: boolean;
  };
  // Basic notification preferences
  notifications: {
    enabled: boolean;
    sound: boolean;
    muteUntil?: Date | null;
  };

  // Friend management (separate from chats and blocking)
  friends: {
    list: string[]; // Array of user IDs who are friends
    pending: string[]; // Array of user IDs with pending friend requests
  };
}

/**
 * Base message type
 */
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  replyTo?: string; // ID of message being replied to
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
}

/**
 * Chat metadata and settings
 */
export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string; // Optional, mainly for group chats
  participants: ChatParticipant[];
  createdAt: Date;
  lastActivity?: Date;
  lastMessage?: Message; // <-- add this
}

/**
 * Request to create a new chat
 */
export interface CreateChatRequest {
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string; // Required for group chats
}

/**
 * Response from creating a chat
 */
export interface CreateChatResponse {
  chatId: string;
  chat: Chat;
}

/**
 * User's chat summary for sidebar display
 */
export interface ChatSummary {
  summaryId: string;
  type: 'direct' | 'group';
  name?: string;
  otherParticipants: BaseUser[]; // Other users in the chat (excluding current user)
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

/**
 * Represents a chat participant with essential display info
 */
export interface ChatParticipant {
  userId: string;
  displayName: string;
  unreadCount: number;
  lastMessage?: Message; // New: last unread message for this participant
  isTyping?: boolean; // Typing indicator state
}
