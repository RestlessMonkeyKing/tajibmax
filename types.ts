import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: any;
  followers?: number;
  following?: number;
  theme?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string; // For groups
  timestamp: Timestamp;
  type: 'text' | 'image' | 'audio' | 'system';
  imageUrl?: string;
  audioUrl?: string;
  isRead: boolean;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  };
  reactions?: Array<{
    userId: string;
    emoji: string;
    timestamp: any;
  }>;
}

export interface Chat {
  id: string;
  members: string[];
  isGroup?: boolean;
  groupName?: string;
  createdBy?: string;
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    type: string;
  };
  unreadCount?: number;
  // Computed properties for UI
  displayName?: string;
  photoURL?: string;
  isOnline?: boolean;
  otherUserId?: string;
}

export interface Notification {
  id: string;
  type: 'message' | 'follow';
  senderId: string;
  chatId?: string;
  read: boolean;
  timestamp: Timestamp;
}

export type Theme = 'light' | 'dark' | 'liquid' | 'sunset' | 'forest';