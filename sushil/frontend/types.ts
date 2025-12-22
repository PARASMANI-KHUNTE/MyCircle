import type { ReactNode } from 'react';

export enum Category {
  JOB = 'job',
  SERVICE = 'service',
  SELL = 'sell',
  RENT = 'rent'
}

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.JOB]: 'Job / Task',
  [Category.SERVICE]: 'Service Offer',
  [Category.SELL]: 'Sell Item',
  [Category.RENT]: 'Rent Item'
};

export enum ExchangeType {
  MONEY = 'money',
  BARTER = 'barter',
  SERVICE = 'service',
  FREE = 'free',
  OPEN = 'open'
}

export const EXCHANGE_LABELS: Record<ExchangeType, string> = {
  [ExchangeType.MONEY]: 'Money',
  [ExchangeType.BARTER]: 'Barter',
  [ExchangeType.SERVICE]: 'Service-for-Service',
  [ExchangeType.FREE]: 'Free',
  [ExchangeType.OPEN]: 'Open to Discussion'
};

export enum PostStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  [PostStatus.OPEN]: 'Open',
  [PostStatus.IN_PROGRESS]: 'In Progress',
  [PostStatus.COMPLETED]: 'Completed',
  [PostStatus.CANCELLED]: 'Cancelled',
  [PostStatus.ARCHIVED]: 'Archived'
};

export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showStats: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  coverImage?: string;
  area?: string;
  email?: string;
  bio?: string;
  completedDeals?: number;
  responseRate?: number;
  joinDate?: string;
  whatsappNumber?: string;
  ratingAvg?: number;
  ratingCount?: number;
  privacy: PrivacySettings;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: Category;
  exchangeType: ExchangeType;
  price?: string; // e.g., "$50" or "Negotiable"
  location: string;
  distance?: number; // km
  images: string[];
  creator: User;
  postedAt: string;
  status: PostStatus;
  expiryDate?: string;
  contactWhatsapp?: string;
  ratingAvg?: number;
  ratingCount?: number;
}

export interface Notification {
  id: string;
  type: 'application' | 'message' | 'system' | 'status';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface ContactRequest {
  id: string;
  post: Pick<Post, 'id' | 'title' | 'category'> & { contactWhatsapp?: string };
  requester: Pick<User, 'id' | 'name' | 'avatar'>;
  recipient: Pick<User, 'id' | 'name' | 'avatar'>;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  post: string;
  postTitle?: string;
  reviewer: Pick<User, 'id' | 'name' | 'avatar'>;
  rating: number;
  text?: string;
  createdAt: string;
  updatedAt: string;
}

export type WithChildren<T = unknown> = T & { children: ReactNode };