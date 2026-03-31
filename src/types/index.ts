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

export interface Worker {
  id: string;
  userId: string;
  name?: string;     // Added direct field
  email?: string;    // Added direct field
  phone?: string;    // Added direct field
  isActive: boolean;
  createdAt: string;
  user?: User;       // Made user optional
}

export interface Task {
  id: string;
  userId: string;
  workerId?: string;
  status: TaskStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  worker?: Worker;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  features: string[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
