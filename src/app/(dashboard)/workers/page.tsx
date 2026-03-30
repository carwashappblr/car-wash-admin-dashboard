'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Worker } from '@/types';
import { Search, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateWorkerModal } from '@/components/workers/CreateWorkerModal';

export default function WorkersPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: workers, isLoading, refetch, error } = useQuery({
    queryKey: ['workers'],
    queryFn: () => apiClient.get<Worker[]>('/workers').then(res => {
      console.log('Workers API Response:', res.data);
      return res.data;
    })
  });

  if (error) {
    console.error('Workers fetch error:', error);
  }

  const filteredWorkers = (Array.isArray(workers) ? workers : [])?.filter(worker => {
    const name = (worker.name || worker.user?.name || '').toLowerCase();
    const email = (worker.email || worker.user?.email || '').toLowerCase();
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Worker Management</h1>
          <p className="text-sm text-gray-500 font-medium">Manage service staff and their statuses</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 text-sm group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Add New Worker
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search workers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:font-normal"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredWorkers?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No workers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredWorkers?.map((worker) => (
                  <tr key={worker.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{worker.name || worker.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{worker.email || worker.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{worker.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        worker.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {worker.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateWorkerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => refetch()}
      />
    </div>
  );
}
