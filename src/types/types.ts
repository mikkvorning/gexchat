import { FieldValue } from 'firebase/firestore';

// No external types needed for now

/**
 * User presence information
 */
interface UserPresence {
  lastSeen?: Date;
  currentActivity?: string;
}

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
 * Extended user info visible in chats
 */
export interface ChatParticipantUser extends BaseUser, UserPresence {}

/**
 * Extended user information visible to friends
 */
export interface FriendUser extends ChatParticipantUser {
  nickname?: string;
  friendshipDate: Date;
}

/**
 * Currently logged in user
 */
export interface CurrentUser extends BaseUser {
  email: string;
  createdAt: Date | FieldValue;

  // User's active chats
  chats: string[]; // Array of chat IDs the user participates in

  // User blocking (independent of friend status)
  blocked: string[]; // Array of user IDs who are blocked

  // Simple privacy settings
  privacy: {
    showStatus: boolean;
    showLastSeen: boolean;
    showActivity: boolean;
    showReadReceipts: boolean; // Whether to show read receipts to others
    allowReadReceipts: boolean; // Whether to receive read receipts from others
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
  readBy?: {
    userId: string;
    readAt: Date;
  }[]; // Track who has read this message and when
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
    lastReadMessageId?: string; // ID of the last message this participant read
    lastReadTimestamp?: Date; // When they last read messages
    unreadMessages?: string[]; // Array of unread message IDs for this participant
  }[];
  createdAt: Date;
  totalMessageCount?: number; // Total messages in chat (for optimization)
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
  chatId: string;
  type: 'direct' | 'group';
  name?: string;
  otherParticipants: BaseUser[]; // Other users in the chat (excluding current user)
  lastMessage?: Message;
  unreadCount: number | '25+' | '50+' | '75+' | '100+'; // Tiered unread count
  updatedAt: Date;
}
