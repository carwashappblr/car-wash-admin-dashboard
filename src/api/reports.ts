import { apiClient } from './client';

// ─── Types ─────────────────────────────────────────────────────

export interface OverviewReport {
  users: { total: number; active: number; inactive: number; newThisMonth: number };
  machines: { total: number; active: number; inactive: number; unassigned: number };
  subscriptions: { total: number; active: number; expiringSoon: number; expired: number };
  revenue: { total: number; thisMonth: number };
  tasks: {
    total: number;
    today: number;
    completedToday: number;
    completionRate: number;
    byStatus: Record<string, number>;
  };
  infrastructure: { communities: number; towers: number; cars: number };
}

export interface TaskReport {
  summary: { total: number; byStatus: Record<string, number>; completionRate: number };
  data: {
    id: string;
    status: string;
    washType: string | null;
    isSubscriptionTask: boolean;
    scheduledDate: string | null;
    completedOn: string | null;
    notes: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string; phone: string | null };
    car: {
      id: string;
      make: string;
      model: string;
      plateNumber: string;
      color: string | null;
      carType: string;
      tower?: { id: string; name: string; community?: { id: string; name: string; city: string | null } } | null;
    };
    machine: { id: string; name: string; email: string } | null;
  }[];
  pagination: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

export interface SubscriptionReport {
  summary: {
    total: number;
    totalRevenue: number;
    averageValue: number;
    byWashType: { washType: string; count: number; revenue: number }[];
    byCarType: { carType: string; count: number; revenue: number }[];
  };
  data: {
    id: string;
    washType: string;
    carType: string;
    washCount: number;
    washesUsed: number;
    remainingWashes: number;
    computedPrice: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isExpired: boolean;
    createdAt: string;
    user: { id: string; name: string; email: string; phone: string | null };
    plan: { id: string; name: string; basePrice: number; durationDays: number };
    car: { id: string; make: string; model: string; plateNumber: string; carType: string; tower?: { name: string; community?: { name: string; city: string | null } } | null };
  }[];
  pagination: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

export interface RevenueReport {
  summary: { totalRevenue: number; totalSubscriptions: number; averageSubscriptionValue: number };
  timeSeries: { period: string; revenue: number; count: number }[];
  byPlan: { planId: string; planName: string; count: number; revenue: number }[];
  byWashType: { washType: string; count: number; revenue: number }[];
}

export interface UserReport {
  summary: { total: number; active: number; inactive: number; newThisMonth: number; withActiveSubscription: number; withoutSubscription: number };
  data: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
    totalWashesUsed: number;
    totalSpent: number;
    _count: { cars: number; subscriptions: number; tasks: number };
  }[];
  pagination: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

export interface MachineReport {
  summary: { total: number; active: number; inactive: number; unassigned: number };
  data: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
    tower: { id: string; name: string; community: { id: string; name: string; city: string | null } } | null;
    _count: { tasks: number };
    taskStats: { total: number; byStatus: Record<string, number>; completionRate: number };
  }[];
}

// ─── API Functions ──────────────────────────────────────────────

export const reportsApi = {
  getOverview: (params?: { from?: string; to?: string; communityId?: string }) =>
    apiClient.get<OverviewReport>('/reports/overview', { params }).then((r) => r.data),

  getTasks: (params?: {
    status?: string;
    towerId?: string;
    machineId?: string;
    communityId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<TaskReport>('/reports/tasks', { params }).then((r) => r.data),

  getSubscriptions: (params?: {
    communityId?: string;
    planId?: string;
    isActive?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<SubscriptionReport>('/reports/subscriptions', { params }).then((r) => r.data),

  getRevenue: (params?: {
    communityId?: string;
    from?: string;
    to?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => apiClient.get<RevenueReport>('/reports/revenue', { params }).then((r) => r.data),

  getUsers: (params?: {
    communityId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<UserReport>('/reports/users', { params }).then((r) => r.data),

  getMachines: (params?: { towerId?: string; communityId?: string; from?: string; to?: string }) =>
    apiClient.get<MachineReport>('/reports/machines', { params }).then((r) => r.data),
};
