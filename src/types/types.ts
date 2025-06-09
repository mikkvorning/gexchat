// No external types needed for now

/**
 * Basic user info available to all users
 */
export interface BaseUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
}

/**
 * Extended user info visible in chats
 */
export interface ChatParticipantUser extends BaseUser {
  lastSeen?: Date;
  currentActivity?: string;
}

/**
 * Extended user information visible to friends
 */
export interface FriendUser extends ChatParticipantUser {
  nickname?: string;
  friendshipDate: Date;
  lastSeen?: Date;
  currentActivity?: string;
}

/**
 * Currently logged in user
 */
export interface CurrentUser extends BaseUser {
  email: string;
  createdAt: Date;

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

  // Friend management
  friends: {
    list: FriendUser[];
    pending: string[];
    blocked: string[];
  };
}

/**
 * Represents a friend relationship between users
 */
export interface Friendship {
  id: string;
  users: [string, string]; // IDs of the two users
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt?: Date;

  // Basic privacy settings
  showActivity: boolean;
  showLastSeen: boolean;
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
  name?: string; // Required for group chats
  participants: {
    userId: string;
    role: 'admin' | 'member';
    joinedAt: Date;
  }[];
  createdAt: Date;
  lastMessage?: Message;
  unreadCount: number;
}

/**
 * Message pagination response
 */
export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Represents chat settings and preferences
 */
export interface ChatSettings {
  userId: string;
  notifications: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  messagePreview: boolean;
}

/**
 * Represents the current state of typing indicators
 */
export interface TypingIndicator {
  chatId: string;
  userId: string;
  timestamp: Date;
}

/**
 * Represents a draft message being composed
 */
export interface MessageDraft {
  chatId: string;
  content: string;
  attachments?: {
    type: 'image' | 'file';
    file: File;
    previewURL?: string;
  }[];
  replyToMessageId?: string;
}
