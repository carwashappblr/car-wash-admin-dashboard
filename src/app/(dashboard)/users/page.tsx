'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Role, User } from '@/types';
import { Search, Loader2 } from 'lucide-react';
import { useState } from 'react';

const roleOptions = [
  { label: 'All Roles', value: 'ALL' },
  { label: 'Admin', value: Role.ADMIN },
  { label: 'User', value: Role.USER },
] as const;

const statusOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
] as const;

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(Role.USER);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users', selectedRole, selectedStatus],
    queryFn: async () => {
      const params: Record<string, string> = {};

      if (selectedRole !== 'ALL') {
        params.role = selectedRole;
      }

      if (selectedStatus !== 'ALL') {
        params.isActive = selectedStatus;
      }

      const endpoint = Object.keys(params).length > 0 ? '/users/filter' : '/users';
      const response = await apiClient.get<User[]>(endpoint, { params });
      return response.data;
    }
  });

  const filteredUsers = (Array.isArray(users) ? users : [])?.filter(user => {
    const name = (user?.name || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-indigo-100 text-indigo-700';
      case Role.WORKER:
        return 'bg-blue-100 text-blue-700';
      case Role.USER:
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

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

  return (
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
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-red-500 font-medium">
                    Could not load users. Please try again.
                  </td>
                </tr>
              ) : filteredUsers?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No users found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
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
  );
}
