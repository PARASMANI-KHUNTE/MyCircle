import { Category, ExchangeType, Post, PostStatus, User } from '../types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  avatar: 'https://picsum.photos/seed/alex/150/150',
  area: 'Downtown District',
  completedDeals: 12,
  responseRate: 98,
  joinDate: '2024-01-15',
  whatsappNumber: '15550000001'
};

export const MOCK_USERS: Record<string, User> = {
  u2: {
    id: 'u2',
    name: 'Sarah Smith',
    avatar: 'https://picsum.photos/seed/sarah/150/150',
    area: 'Westside',
    completedDeals: 45,
    responseRate: 92,
    joinDate: '2023-11-01',
    whatsappNumber: '15550000002'
  },
  u3: {
    id: 'u3',
    name: 'Mike Chen',
    avatar: 'https://picsum.photos/seed/mike/150/150',
    area: 'North Hills',
    completedDeals: 8,
    responseRate: 85,
    joinDate: '2024-02-10',
    whatsappNumber: '15550000003'
  }
};

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    title: 'Need help moving a couch',
    description: 'I need someone strong to help me move a 3-seater couch down two flights of stairs. Should take about 30 mins.',
    category: Category.JOB,
    exchangeType: ExchangeType.MONEY,
    price: '$40',
    location: 'Downtown District',
    distance: 0.5,
    images: ['https://picsum.photos/seed/couch/400/300'],
    creator: MOCK_USERS.u2,
    postedAt: '2 hours ago',
    status: PostStatus.OPEN
  },
  {
    id: 'p2',
    title: 'Vintage Film Camera for Sale',
    description: 'Canon AE-1 in great condition. Comes with 50mm lens. Perfect for students.',
    category: Category.SELL,
    exchangeType: ExchangeType.MONEY,
    price: '$150',
    location: 'North Hills',
    distance: 3.2,
    images: ['https://picsum.photos/seed/camera/400/300', 'https://picsum.photos/seed/lens/400/300'],
    creator: MOCK_USERS.u3,
    postedAt: '1 day ago',
    status: PostStatus.OPEN
  },
  {
    id: 'p3',
    title: 'Offering Spanish Lessons',
    description: 'Native speaker offering conversational Spanish lessons. Can meet at local cafe or online.',
    category: Category.SERVICE,
    exchangeType: ExchangeType.SERVICE,
    price: 'Exchange for Piano Lessons',
    location: 'Westside',
    distance: 1.8,
    images: ['https://picsum.photos/seed/spanish/400/300'],
    creator: MOCK_USERS.u2,
    postedAt: '3 days ago',
    status: PostStatus.OPEN
  },
  {
    id: 'p4',
    title: 'Pressure Washer for Rent',
    description: 'Heavy duty pressure washer available for daily rent.',
    category: Category.RENT,
    exchangeType: ExchangeType.MONEY,
    price: '$30/day',
    location: 'East Village',
    distance: 5.0,
    images: ['https://picsum.photos/seed/washer/400/300'],
    creator: MOCK_USERS.u3,
    postedAt: '5 hours ago',
    status: PostStatus.OPEN
  }
];
