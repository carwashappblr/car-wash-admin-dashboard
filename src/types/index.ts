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
  price: number;
  durationInDays: number;
  features: string[];
  createdAt: string;
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

export interface AuthResponse {
  accessToken: string;
  user: User;
}
