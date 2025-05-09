/**
 * Base user information that is always public to other users
 * Only id and displayName are required as they're essential for the app to function
 */
export interface PublicUser {
  id: string;
  displayName: string;
  photoURL?: string;
  status?: 'online' | 'offline' | 'away';
  bio?: string; // Can be shared publicly if user chooses
}

/**
 * Additional user information visible to users in shared chats
 * All fields are optional as users might want to restrict what chat participants can see
 */
export interface ChatParticipantUser extends PublicUser {
  lastSeen?: Date;
  lastTyping?: Date;
  email?: string; // Optional email sharing with chat participants
  timezone?: string; // Optional timezone sharing for coordination
}

/**
 * Extended user information visible to friends
 * Most fields are optional to allow granular privacy control
 */
export interface FriendUser extends ChatParticipantUser {
  mutualFriends?: number; // Optional: Some users might not want to share their connections
  mutualChats?: number;
  customNickname?: string;
  friendshipDate: Date; // Required as it's fundamental to the friendship
  sharedEmail?: boolean; // Indicates if email is shared with this friend
  sharedPhone?: boolean; // Indicates if phone number is shared with this friend
  sharedInterests?: string[];
  sharedActivity?: {
    // Optional activity sharing
    recentlyActive?: boolean;
    lastSeen?: Date;
    currentChat?: string;
    listeningTo?: string;
    playing?: string;
  };
}

/**
 * Represents a friend relationship between users
 */
export interface Friendship {
  id: string;
  users: [string, string]; // IDs of the two users
  status: 'pending' | 'accepted' | 'blocked';
  initiatedBy: string; // User ID who sent the request
  createdAt: Date;
  acceptedAt?: Date;
  customSettings?: {
    sharePresence: boolean;
    shareActivity: boolean;
    notifyOnline: boolean;
    priority: 'normal' | 'close' | 'best';
  };
}

/**
 * Complete user profile with private information
 * Only available for the currently authenticated user
 */
export interface CurrentUser extends PublicUser {
  email: string;
  phoneNumber?: string;
  settings: ChatSettings;
  presence: {
    lastSeen: Date;
    lastActive: Date;
    deviceType?: 'mobile' | 'desktop' | 'web';
    showAsOnline: boolean;
  };
  notifications: {
    token?: string;
    enabled: boolean;
    muteUntil?: Date;
  };
  friends: {
    all: FriendUser[];
    pending: {
      sent: string[]; // IDs of users we've sent requests to
      received: string[]; // IDs of users who sent us requests
    };
    blocked: string[]; // IDs of users we've blocked
    settings: {
      autoAccept: 'none' | 'mutualFriends' | 'all';
      defaultCustomSettings: Friendship['customSettings'];
    };
  };
  bio?: string;
  interests?: string[];
  timezone: string;
  visibility: {
    profile: 'public' | 'friends' | 'private';
    lastSeen: 'everyone' | 'friends' | 'nobody';
    status: 'everyone' | 'friends' | 'nobody';
    email: 'everyone' | 'friends' | 'mutualFriends' | 'nobody';
    phone: 'friends' | 'mutualFriends' | 'nobody';
    interests: 'public' | 'friends' | 'nobody';
    activity: 'everyone' | 'friends' | 'nobody';
    timezone: 'everyone' | 'friends' | 'nobody';
    mutuals: 'everyone' | 'friends' | 'nobody';
  };
}

/**
 * Represents metadata about the message history in a chat
 * Used for pagination and quick stats without loading all messages
 */
export interface ChatMessageMetadata {
  totalMessages: number;
  firstMessageDate?: Date;
  lastMessageDate?: Date;
}

/**
 * Represents a paginated subset of messages
 * Used when loading messages in chunks rather than all at once
 * Cursors enable both forward and backward pagination
 */
export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

/**
 * Represents a chat conversation between users
 * Core chat data without the full message history
 */
export interface Chat {
  id: string;
  type: 'direct' | 'group';
  participants: {
    userId: string;
    role?: 'admin' | 'member';
    joinedAt: Date;
    user: ChatParticipantUser; // Only include participant-level user info
  }[];
  name?: string; // Optional: Only for group chats
  createdAt: Date;
  updatedAt: Date;
  metadata: ChatMessageMetadata;
  lastMessage?: Message; // Cache of the last message for quick access
  unreadCount?: number;
}

/**
 * Represents a message within a chat
 */
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: {
    type: 'text' | 'image' | 'file' | 'system';
    text?: string;
    fileURL?: string;
    fileName?: string;
    fileSize?: number;
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  createdAt: Date;
  updatedAt?: Date;
  replyTo?: Message;
  reactions?: MessageReaction[];
  isEdited?: boolean;
}

/**
 * Represents a reaction to a message
 */
export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
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
