export enum Category {
  JOB = 'Job/Task',
  SERVICE = 'Service Offer',
  SELL = 'Sell Item',
  RENT = 'Rent Item'
}

export enum ExchangeType {
  MONEY = 'Money',
  BARTER = 'Barter',
  SERVICE = 'Service-for-Service',
  FREE = 'Free',
  OPEN = 'Open to Discussion'
}

export enum PostStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  area: string;
  completedDeals: number;
  responseRate: number;
  joinDate: string;
  whatsappNumber: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: Category;
  exchangeType: ExchangeType;
  price?: string; // e.g., "$50" or "Negotiable"
  location: string;
  distance: number; // km
  images: string[];
  creator: User;
  postedAt: string;
  status: PostStatus;
}

export interface Notification {
  id: string;
  type: 'application' | 'message' | 'system' | 'status';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}
