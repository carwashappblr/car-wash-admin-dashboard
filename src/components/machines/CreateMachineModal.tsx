'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community } from '@/types';
import { toast } from 'sonner';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface CreateMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateMachinePayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  towerId: string;
}

export function CreateMachineModal({ isOpen, onClose, onSuccess }: CreateMachineModalProps) {
  const [formData, setFormData] = useState<CreateMachinePayload>({
    name: '',
    email: '',
    password: '',
    phone: '',
    towerId: '',
  });
  const [selectedCommunityId, setSelectedCommunityId] = useState('');

  const { data: communities, isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data)
  });

  const availableCommunities = Array.isArray(communities) ? communities : [];
  const selectedCommunity = availableCommunities.find((community) => community.id === selectedCommunityId);
  const availableTowers = selectedCommunity?.towers ?? [];

  const mutation = useMutation({
    mutationFn: (data: CreateMachinePayload) => apiClient.post('/machines', data),
    onSuccess: () => {
      toast.success('Machine Created', {
        description: 'New service staff member added successfully.',
      });
      setFormData({ name: '', email: '', password: '', phone: '', towerId: '' });
      setSelectedCommunityId('');
      onSuccess();
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error('Failed to create machine', {
        description: error.response?.data?.message || 'Please check the provided data.',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.towerId) {
      toast.error('Select a tower', {
        description: 'Please choose a community and tower before creating the machine.',
      });
      return;
    }

    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-100 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">Add Machine</h2>
              <p className="text-xs text-gray-500 font-medium">Create a new machine account</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Machine Name</label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                placeholder="Machine A1"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Phone Number</label>
              <input 
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Email Address</label>
            <input 
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
              placeholder="machine@carwash.com"
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Tower Mapping</h3>
              <p className="text-xs text-gray-500 font-medium">Choose the community first, then assign the machine to one of its towers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Community</label>
                <select
                  required
                  value={selectedCommunityId}
                  onChange={(e) => {
                    setSelectedCommunityId(e.target.value);
                    setFormData({ ...formData, towerId: '' });
                  }}
                  disabled={communitiesLoading || availableCommunities.length === 0}
                  className="w-full bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
                >
                  <option value="">
                    {communitiesLoading ? 'Loading communities...' : 'Select community'}
                  </option>
                  {availableCommunities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tower</label>
                <select
                  required
                  value={formData.towerId}
                  onChange={(e) => setFormData({ ...formData, towerId: e.target.value })}
                  disabled={!selectedCommunityId || availableTowers.length === 0}
                  className="w-full bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
                >
                  <option value="">
                    {!selectedCommunityId ? 'Select community first' : 'Select tower'}
                  </option>
                  {availableTowers.map((tower) => (
                    <option key={tower.id} value={tower.id}>
                      {tower.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Initial Password</label>
            <input 
              type="password"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={clsx(
                "flex-1 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20",
                mutation.isPending && "opacity-70 cursor-not-allowed"
              )}
            >
              {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
