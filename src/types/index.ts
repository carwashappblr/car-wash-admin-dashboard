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

export interface PricingTier {
  id: string;
  planId: string;
  carType: 'HATCHBACK' | 'SEDAN' | 'SUV';
  washType: 'EXTERIOR' | 'EXTERIOR_INTERIOR' | 'PREMIUM';
  priceMultiplier: number;
  surcharge: number;
}

export interface SubscriptionPlan {
  id: string;
  communityId: string;
  name: string;
  description?: string | null;
  basePrice: number;
  baseWashCount: number;
  extraWashPrice: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pricingTiers?: PricingTier[];
}

export interface CreateSubscriptionPlanPayload {
  communityId: string;
  name: string;
  description?: string;
  basePrice: number;
  baseWashCount: number;
  durationDays: number;
  extraWashPrice?: number;
  pricingTiers?: Omit<PricingTier, 'id' | 'planId'>[];
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
  washCount: number;
  carType: 'HATCHBACK' | 'SEDAN' | 'SUV';
  washType: 'EXTERIOR' | 'EXTERIOR_INTERIOR' | 'PREMIUM';
  computedPrice: number;
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

