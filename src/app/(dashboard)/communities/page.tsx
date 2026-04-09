'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community } from '@/types';
import { Search, Loader2, Plus, Building2, Pencil } from 'lucide-react';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import { EditCommunityModal } from '@/components/communities/EditCommunityModal';

interface CommunityRow {
  rowId: string;
  communityId: string;
  communityName: string;
  towerName: string;
  city: string;
  address: string;
  isActive: boolean;
}

export default function CommunitiesPage() {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCommunityId, setEditingCommunityId] = useState<string | null>(null);

  const { data: communities, isLoading, refetch, error } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data)
  });

  if (error) {
    console.error('Communities fetch error:', error);
  }

  const rows = useMemo<CommunityRow[]>(() => {
    const communityList = Array.isArray(communities) ? communities : [];

    return communityList.flatMap((community) => {
      if (!community.towers?.length) {
        return [
          {
            rowId: `${community.id}-no-tower`,
            communityId: community.id,
            communityName: community.name,
            towerName: 'No tower added',
            city: community.city,
            address: community.address,
            isActive: community.isActive,
          },
        ];
      }

      return community.towers.map((tower) => ({
        rowId: tower.id,
        communityId: community.id,
        communityName: community.name,
        towerName: tower.name,
        city: community.city,
        address: community.address,
        isActive: community.isActive && tower.isActive,
      }));
    });
  }, [communities]);

  const filteredRows = rows.filter((row) => {
    const searchTerm = search.toLowerCase();
    return (
      row.communityName.toLowerCase().includes(searchTerm) ||
      row.towerName.toLowerCase().includes(searchTerm) ||
      row.city.toLowerCase().includes(searchTerm) ||
      row.address.toLowerCase().includes(searchTerm)
    );
  });

  const selectedCommunity = useMemo(() => {
    if (!editingCommunityId || !Array.isArray(communities)) {
      return null;
    }

    return communities.find((community) => community.id === editingCommunityId) ?? null;
  }, [communities, editingCommunityId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Management</h1>
          <p className="text-sm text-gray-500 font-medium">Manage communities and the towers available within each location</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 text-sm group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Add New Community
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search communities, towers, cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:font-normal"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Building2 className="w-3.5 h-3.5" />
            {rows.length} tower rows
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Community</th>
                <th className="px-6 py-4">Tower</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No community records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.rowId} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{row.communityName}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{row.towerName}</td>
                    <td className="px-6 py-4 text-gray-700">{row.city}</td>
                    <td className="px-6 py-4 text-gray-500">{row.address}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingCommunityId(row.communityId)}
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <EditCommunityModal
        key={selectedCommunity ? `${selectedCommunity.id}-${selectedCommunity.updatedAt}` : 'edit-community'}
        isOpen={Boolean(selectedCommunity)}
        community={selectedCommunity}
        onClose={() => setEditingCommunityId(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
