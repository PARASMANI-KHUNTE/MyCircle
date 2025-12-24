import {
  Category,
  ContactRequest,
  ExchangeType,
  Post,
  PostStatus,
  PrivacySettings,
  Review,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mycircle-qrl4.onrender.com';
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neighbor';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80';

export interface ApiUser {
  _id: string;
  id?: string;
  displayName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  area?: string;
  location?: string;
  bio?: string;
  completedDeals?: number;
  responseRate?: number;
  joinDate?: string;
  createdAt?: string;
  whatsappNumber?: string;
  contactWhatsapp?: string;
  ratingAvg?: number;
  ratingCount?: number;
  privacy?: Partial<PrivacySettings>;
  stats?: {
    totalPosts?: number;
    activePosts?: number;
    tasksCompleted?: number;
  };
}

export interface ApiPost {
  _id: string;
  id?: string;
  user: ApiUser;
  type: 'job' | 'service' | 'sell' | 'rent';
  title: string;
  description: string;
  price?: number;
  location: string;
  images?: string[];
  status: 'open' | 'closed';
  acceptsBarter?: boolean;
  barterPreferences?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  likes?: string[];
  shares?: number;
  createdAt?: string;
  updatedAt?: string;
  ratingAvg?: number;
  ratingCount?: number;
}

export interface ApiContactRequest {
  _id: string;
  id?: string;
  post: {
    _id: string;
    id?: string;
    title: string;
    type: ApiPost['type'];
    contactWhatsapp?: string;
  };
  requester: ApiUser;
  recipient: ApiUser;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: string;
}

export interface ApiReview {
  _id: string;
  id?: string;
  post: string | { _id?: string; title?: string };
  reviewer: ApiUser;
  rating: number;
  text?: string;
  createdAt: string;
  updatedAt: string;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown> | FormData;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  if (token) {
    headers['x-auth-token'] = token;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

const ensurePrivacy = (privacy?: Partial<PrivacySettings>): PrivacySettings => ({
  showEmail: privacy?.showEmail ?? false,
  showPhone: privacy?.showPhone ?? true,
  showLocation: privacy?.showLocation ?? true,
  showStats: privacy?.showStats ?? true,
});

const formatRelativeTime = (timestamp?: string) => {
  if (!timestamp) return 'Just now';
  const now = Date.now();
  const value = new Date(timestamp).getTime();
  const diff = now - value;

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
};

const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return undefined;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

const mapApiUserToUser = (apiUser: ApiUser): User => ({
  id: apiUser.id ?? apiUser._id,
  name: apiUser.displayName ?? apiUser.name ?? 'Community Member',
  avatar: apiUser.avatar ?? DEFAULT_AVATAR,
  coverImage: undefined,
  area: apiUser.area ?? apiUser.location ?? 'Neighborhood',
  email: apiUser.email,
  bio: apiUser.bio ?? '',
  completedDeals: apiUser.completedDeals ?? apiUser.stats?.tasksCompleted ?? 0,
  responseRate: apiUser.responseRate ?? 100,
  joinDate: apiUser.joinDate ?? apiUser.createdAt ?? new Date().toISOString(),
  whatsappNumber: apiUser.whatsappNumber ?? apiUser.contactWhatsapp,
  ratingAvg: apiUser.ratingAvg,
  ratingCount: apiUser.ratingCount,
  privacy: ensurePrivacy(apiUser.privacy),
});

const mapApiPostToPost = (apiPost: ApiPost): Post => {
  const categoryMap: Record<ApiPost['type'], Category> = {
    job: Category.JOB,
    service: Category.SERVICE,
    sell: Category.SELL,
    rent: Category.RENT,
  };

  const statusMap: Record<ApiPost['status'], PostStatus> = {
    open: PostStatus.OPEN,
    closed: PostStatus.ARCHIVED,
  };

  let exchangeType: ExchangeType = ExchangeType.MONEY;
  if (apiPost.acceptsBarter) {
    exchangeType = ExchangeType.BARTER;
  } else if (!apiPost.price) {
    exchangeType = ExchangeType.OPEN;
  }

  return {
    id: apiPost.id ?? apiPost._id,
    title: apiPost.title,
    description: apiPost.description,
    category: categoryMap[apiPost.type] ?? Category.JOB,
    exchangeType,
    price: formatPrice(apiPost.price) ?? apiPost.barterPreferences ?? exchangeType,
    location: apiPost.location,
    distance: undefined,
    images: apiPost.images && apiPost.images.length > 0 ? apiPost.images : [DEFAULT_IMAGE],
    creator: mapApiUserToUser(apiPost.user),
    postedAt: formatRelativeTime(apiPost.createdAt ?? apiPost.updatedAt),
    status: statusMap[apiPost.status] ?? PostStatus.OPEN,
    expiryDate: undefined,
    contactWhatsapp: apiPost.contactWhatsapp ?? apiPost.user?.contactWhatsapp,
    ratingAvg: apiPost.ratingAvg ?? apiPost.user?.ratingAvg ?? 0,
    ratingCount: apiPost.ratingCount ?? apiPost.user?.ratingCount ?? 0,
  };
};

const normalizePosts = (posts: ApiPost[]): Post[] => posts.map(mapApiPostToPost);

const mapApiRequestToContactRequest = (req: ApiContactRequest): ContactRequest => ({
  id: req.id ?? req._id,
  post: {
    id: req.post.id ?? req.post._id,
    title: req.post.title,
    category: ({
      job: Category.JOB,
      service: Category.SERVICE,
      sell: Category.SELL,
      rent: Category.RENT,
    } as Record<ApiPost['type'], Category>)[req.post.type] ?? Category.JOB,
    contactWhatsapp: req.post.contactWhatsapp,
  },
  requester: mapApiUserToUser(req.requester),
  recipient: mapApiUserToUser(req.recipient),
  status: req.status,
  message: req.message,
  createdAt: req.createdAt,
});

const mapApiReviewToReview = (rev: ApiReview): Review => {
  const postId = typeof rev.post === 'string' ? rev.post : rev.post._id ?? '';
  const postTitle = typeof rev.post === 'string' ? undefined : rev.post.title;
  return {
    id: rev.id ?? rev._id,
    post: postId,
    postTitle,
    reviewer: mapApiUserToUser(rev.reviewer),
    rating: rev.rating,
    text: rev.text,
    createdAt: rev.createdAt,
    updatedAt: rev.updatedAt,
  };
};

export const api = {
  devLogin(email: string) {
    return request<{ token: string }>('/auth/dev-login', {
      method: 'POST',
      body: { email },
    });
  },

  async getCurrentUser(token: string) {
    const user = await request<ApiUser>('/api/user/profile', { token });
    return mapApiUserToUser(user);
  },

  async updateCurrentUser(token: string, payload: Record<string, unknown>) {
    const user = await request<ApiUser>('/api/user/profile', {
      method: 'PUT',
      token,
      body: payload,
    });
    return mapApiUserToUser(user);
  },

  async getPublicProfile(userId: string) {
    const user = await request<ApiUser>(`/api/user/${userId}`);
    return mapApiUserToUser(user);
  },

  getUserStats(token: string) {
    return request<{ stats: ApiUser['stats']; rating?: number; reviews?: number; joined?: string }>(
      '/api/user/stats',
      { token }
    );
  },

  async getPublicFeed() {
    const data = await request<{ posts: ApiPost[] }>('/api/posts/feed/public');
    return normalizePosts(data.posts);
  },

  async getPersonalFeed(token: string) {
    const data = await request<{ posts: ApiPost[] }>('/api/posts/feed/personal', {
      token,
    });
    return normalizePosts(data.posts);
  },

  async getPostById(postId: string, token?: string | null) {
    const post = await request<ApiPost>(`/api/posts/${postId}`, { token: token ?? undefined });
    return mapApiPostToPost(post);
  },

  async getPostReviews(postId: string) {
    const reviews = await request<ApiReview[]>(`/api/posts/${postId}/reviews`);
    return reviews.map(mapApiReviewToReview);
  },

  async getUserReviews(userId: string) {
    const reviews = await request<ApiReview[]>(`/api/user/${userId}/reviews`);
    return reviews.map(mapApiReviewToReview);
  },

  async upsertPostReview(token: string, postId: string, rating: number, text?: string) {
    const body: Record<string, unknown> = { rating };
    if (text !== undefined) body.text = text;
    const res = await request<{
      review: ApiReview;
      postRating: { avgRating: number; count: number };
      ownerRating: { avgRating: number; count: number };
    }>(`/api/posts/${postId}/reviews`, {
      method: 'POST',
      token,
      body,
    });
    return {
      review: mapApiReviewToReview(res.review),
      postRating: res.postRating,
      ownerRating: res.ownerRating,
    };
  },

  async getMyPosts(token: string) {
    const posts = await request<ApiPost[]>('/api/posts/my-posts', { token });
    return normalizePosts(posts);
  },

  async getPostsByUser(userId: string, token?: string | null) {
    const query = new URLSearchParams({ user: userId }).toString();
    const posts = await request<ApiPost[]>(`/api/posts?${query}`, { token: token ?? undefined });
    return normalizePosts(posts);
  },

  async getAllPosts(token?: string | null) {
    const posts = await request<ApiPost[]>('/api/posts', { token: token ?? undefined });
    return normalizePosts(posts);
  },

  async createPost(token: string, formData: FormData) {
    const post = await request<ApiPost>('/api/posts', {
      method: 'POST',
      token,
      body: formData,
    });
    return mapApiPostToPost(post);
  },

  async updatePost(token: string, postId: string, payload: Record<string, unknown>) {
    const post = await request<ApiPost>(`/api/posts/${postId}`, {
      method: 'PUT',
      token,
      body: payload,
    });
    return mapApiPostToPost(post);
  },

  deletePost(token: string, postId: string) {
    return request<{ msg: string }>(`/api/posts/${postId}`, {
      method: 'DELETE',
      token,
    });
  },

  async createContactRequest(token: string, postId: string, message?: string) {
    const body: Record<string, unknown> = {};
    if (message) body.message = message;
    const req = await request<ApiContactRequest>(`/api/contact/${postId}`, {
      method: 'POST',
      token,
      body,
    });
    return mapApiRequestToContactRequest(req);
  },

  async getSentRequests(token: string) {
    const data = await request<ApiContactRequest[]>('/api/contact/sent', { token });
    return data.map(mapApiRequestToContactRequest);
  },

  async getReceivedRequests(token: string) {
    const data = await request<ApiContactRequest[]>('/api/contact/received', { token });
    return data.map(mapApiRequestToContactRequest);
  },

  async updateRequestStatus(token: string, requestId: string, status: 'approved' | 'rejected') {
    const req = await request<ApiContactRequest>(`/api/contact/${requestId}/status`, {
      method: 'PUT',
      token,
      body: { status },
    });
    return mapApiRequestToContactRequest(req);
  },
};

export type ApiClient = typeof api;
