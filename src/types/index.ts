export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  WORKER = 'WORKER',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive?: boolean;
  createdAt: string;
}

export interface Machine {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  towerId?: string;
  role?: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  machineId?: string;
  status: TaskStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  machine?: Machine;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  durationDays: number;
  washCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPlanPayload {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  washCount: number;
}

export interface Tower {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  towers: Tower[];
}

export interface Car {
  id: string;
  plateNumber: string;
  color: string;
  make: string;
  model: string;
  year?: number;
  defaultSlotNumber?: string;
  towerId?: string;
  tower?: {
    id: string;
    name: string;
    communityId: string;
    community?: {
      id: string;
      name: string;
      city: string;
      address: string;
    };
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  carId: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  washesUsed: number;
  remainingWashes: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  plan: SubscriptionPlan;
  car: Car;
  tasks: Array<{
    id: string;
    status: TaskStatus;
    scheduledDate: string | null;
    machineId: string | null;
    slotId: string | null;
    createdAt: string;
  }>;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

