'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community, User } from '@/types';
import { Search, Loader2, X } from 'lucide-react';
import { useState } from 'react';

const statusOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
] as const;

type DetailsValue = string | number | boolean | null | undefined;

interface UserDetailsResponse {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  personalDetails?: Record<string, unknown>;
  user?: Record<string, unknown>;
  carDetails?: Record<string, unknown> | Array<Record<string, unknown>>;
  car?: Record<string, unknown> | Array<Record<string, unknown>>;
  cars?: Array<Record<string, unknown>>;
  subscriptions?: Array<Record<string, unknown>>;
  subscriptionPlan?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  plan?: Record<string, unknown>;
}

const ignoredDetailKeys = new Set([
  'id',
  'userId',
  'createdAt',
  'updatedAt',
  '__v',
]);

const formatLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value: DetailsValue) => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return String(value);
};

const getDisplayEntries = (data?: Record<string, unknown>) => {
  if (!data) {
    return [];
  }

  return Object.entries(data).filter(([key, value]) => {
    if (ignoredDetailKeys.has(key)) {
      return false;
    }

    return ['string', 'number', 'boolean'].includes(typeof value) || value == null;
  });
};

function DetailsSection({
  title,
  data,
}: {
  title: string;
  data?: Record<string, unknown>;
}) {
  const entries = getDisplayEntries(data);

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">{title}</h3>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-6 text-sm font-medium text-gray-400">
          No details available.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {formatLabel(key)}
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-800">
                {formatValue(value as DetailsValue)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function UserDetailsModal({
  isOpen,
  user,
  isLoading,
  isError,
  details,
  onClose,
}: {
  isOpen: boolean;
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  details?: UserDetailsResponse;
  onClose: () => void;
}) {
  if (!isOpen || !user) {
    return null;
  }

  const personalDetails = (details?.personalDetails ||
    details?.user ||
    details) as Record<string, unknown> | undefined;
  const subscriptions = Array.isArray(details?.subscriptions)
    ? details.subscriptions.filter(
        (subscription): subscription is Record<string, unknown> =>
          Boolean(subscription && typeof subscription === 'object')
      )
    : [];
  const subscriptionPlan =
    ((details?.subscriptionPlan ||
      details?.subscription ||
      details?.plan ||
      subscriptions[0]?.plan) as Record<string, unknown> | undefined);
  const carSource = details?.carDetails || details?.car || details?.cars;
  const carDetails = Array.isArray(carSource)
    ? carSource.filter((car): car is Record<string, unknown> => Boolean(car && typeof car === 'object'))
    : carSource && typeof carSource === 'object'
      ? [carSource as Record<string, unknown>]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">{user.name}</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">{user.email}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-sm font-medium text-red-600">
              Could not load user details. Please try again.
            </div>
          ) : (
            <div className="space-y-8">
              <DetailsSection title="Personal Details" data={personalDetails} />

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">Car Details</h3>
                </div>

                {carDetails.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-6 text-sm font-medium text-gray-400">
                    No car details available.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {carDetails.map((car, index) => (
                      <div key={`car-${index}`} className="rounded-3xl border border-gray-100 p-4">
                        {carDetails.length > 1 ? (
                          <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                            Car {index + 1}
                          </div>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {getDisplayEntries(car).map(([key, value]) => (
                            <div key={key} className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                                {formatLabel(key)}
                              </div>
                              <div className="mt-1 text-sm font-semibold text-gray-800">
                                {formatValue(value as DetailsValue)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <DetailsSection title="Subscription Plan" data={subscriptionPlan} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<string>('ALL');
  const [selectedTower, setSelectedTower] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: communities } = useQuery<Community[]>({
    queryKey: ['communities'],
    queryFn: async () => {
      const response = await apiClient.get<Community[]>('/communities');
      return response.data;
    },
  });

  const availableTowers = Array.isArray(communities)
    ? communities.find((c) => c.id === selectedCommunity)?.towers || []
    : [];

  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunity(communityId);
    setSelectedTower('ALL');
  };

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users', selectedCommunity, selectedTower, selectedStatus],
    queryFn: async () => {
      const params: Record<string, string> = {
        role: 'USER',
      };

      if (selectedCommunity !== 'ALL') {
        params.communityId = selectedCommunity;
      }

      if (selectedTower !== 'ALL') {
        params.towerId = selectedTower;
      }

      if (selectedStatus !== 'ALL') {
        params.isActive = selectedStatus;
      }

      const response = await apiClient.get<User[]>('/users/filter', { params });
      return response.data;
    },
  });

  const {
    data: userDetails,
    isLoading: isUserDetailsLoading,
    isError: isUserDetailsError,
  } = useQuery({
    queryKey: ['user-details', selectedUser?.id],
    queryFn: async () => {
      const response = await apiClient.get<UserDetailsResponse>(`/users/${selectedUser?.id}/details`);
      return response.data;
    },
    enabled: Boolean(selectedUser?.id),
  });

  const filteredUsers = (Array.isArray(users) ? users : [])?.filter((user) => {
    const name = (user?.name || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  const renderStatus = (isActive?: boolean) => {
    if (typeof isActive !== 'boolean') {
      return <span className="text-xs font-semibold text-gray-400">Unknown</span>;
    }

    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className={`text-xs font-semibold ${isActive ? 'text-gray-700' : 'text-red-600'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    );
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 font-medium">View and manage customer accounts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gray-50/50">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:font-normal"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <select
                value={selectedCommunity}
                onChange={(e) => handleCommunityChange(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">All Communities</option>
                {communities?.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTower}
                onChange={(e) => setSelectedTower(e.target.value)}
                disabled={selectedCommunity === 'ALL'}
                className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="ALL">All Towers</option>
                {availableTowers.map((tower) => (
                  <option key={tower.id} value={tower.id}>
                    {tower.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Community</th>
                  <th className="px-6 py-4">Tower</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-red-500 font-medium">
                      Could not load users. Please try again.
                    </td>
                  </tr>
                ) : filteredUsers?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                      No users found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers?.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="cursor-pointer transition-colors hover:bg-blue-50/30"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {user.community?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {user.tower?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">{renderStatus(user.isActive)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UserDetailsModal
        isOpen={Boolean(selectedUser)}
        user={selectedUser}
        isLoading={isUserDetailsLoading}
        isError={isUserDetailsError}
        details={userDetails}
        onClose={handleCloseModal}
      />
    </>
  );
}
