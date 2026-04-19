'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community, Machine } from '@/types';
import { toast } from 'sonner';
import { X, Loader2, Pencil } from 'lucide-react';
import { clsx } from 'clsx';

interface EditMachineModalProps {
  isOpen: boolean;
  machine: Machine | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditMachineFormState {
  name: string;
  email: string;
  phone: string;
  towerId: string;
  isActive: boolean;
}

interface EditMachinePayload {
  name?: string;
  email?: string;
  phone?: string;
  towerId?: string;
  isActive?: boolean;
}

const emptyFormState: EditMachineFormState = {
  name: '',
  email: '',
  phone: '',
  towerId: '',
  isActive: true,
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

function getInitialState(machine: Machine | null): EditMachineFormState {
  if (!machine) {
    return emptyFormState;
  }

  return {
    name: machine.name ?? '',
    email: normalizeEmail(machine.email ?? ''),
    phone: machine.phone ?? '',
    towerId: machine.towerId ?? '',
    isActive: machine.isActive,
  };
}

export function EditMachineModal({ isOpen, machine, onClose, onSuccess }: EditMachineModalProps) {
  const [formData, setFormData] = useState<EditMachineFormState>(() => getInitialState(machine));
  const [selectedCommunityId, setSelectedCommunityId] = useState('');

  const { data: communities, isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data),
  });

  const availableCommunities = Array.isArray(communities)
    ? communities.filter((community) => community.isActive)
    : [];

  const derivedCommunityId = availableCommunities.find((community) =>
    community.towers.some((tower) => tower.id === formData.towerId)
  )?.id ?? '';
  const activeCommunityId = selectedCommunityId || derivedCommunityId;
  const selectedCommunity = availableCommunities.find((community) => community.id === activeCommunityId);
  const availableTowers = selectedCommunity?.towers.filter((tower) => tower.isActive) ?? [];

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditMachinePayload }) =>
      apiClient.patch(`/machines/${id}`, data),
    onSuccess: () => {
      toast.success('Machine Updated', {
        description: 'The machine details were updated successfully.',
      });
      onSuccess();
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error('Failed to update machine', {
        description: error.response?.data?.message || 'Please review the details and try again.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!machine) {
      return;
    }

    const cleanedFormData: EditMachineFormState = {
      name: formData.name.trim(),
      email: normalizeEmail(formData.email),
      phone: formData.phone.trim(),
      towerId: formData.towerId,
      isActive: formData.isActive,
    };

    if (!cleanedFormData.name || !cleanedFormData.email) {
      toast.error('Missing required details', {
        description: 'Machine name and email are required.',
      });
      return;
    }

    if (!cleanedFormData.towerId) {
      toast.error('Select a tower', {
        description: 'Please choose a community and tower before saving the machine.',
      });
      return;
    }

    const payload: EditMachinePayload = {};

    if (cleanedFormData.name !== (machine.name ?? '')) {
      payload.name = cleanedFormData.name;
    }

    if (cleanedFormData.email !== normalizeEmail(machine.email ?? '')) {
      payload.email = cleanedFormData.email;
    }

    if (cleanedFormData.phone !== (machine.phone ?? '')) {
      payload.phone = cleanedFormData.phone;
    }

    if (cleanedFormData.towerId !== (machine.towerId ?? '')) {
      payload.towerId = cleanedFormData.towerId;
    }

    if (cleanedFormData.isActive !== machine.isActive) {
      payload.isActive = cleanedFormData.isActive;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save', {
        description: 'Update a field before saving the machine.',
      });
      return;
    }

    mutation.mutate({ id: machine.id, data: payload });
  };

  if (!isOpen || !machine) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-100 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">Edit Machine</h2>
              <p className="text-xs text-gray-500 font-medium">Update machine account details</p>
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
                onChange={(e) => setFormData((current) => ({ ...current, name: e.target.value }))}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                placeholder="Machine A1"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData((current) => ({ ...current, phone: e.target.value }))}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
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
              onChange={(e) => setFormData((current) => ({ ...current, email: normalizeEmail(e.target.value) }))}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
              placeholder="machine@carwash.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'h-3 w-3 rounded-full',
                    formData.isActive ? 'bg-green-500' : 'bg-red-500'
                  )}
                />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Machine Status</h3>
                  <p className="text-xs text-gray-500 font-medium">Enable or disable this machine account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData((current) => ({ ...current, isActive: !current.isActive }))}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors',
                  formData.isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                )}
              >
                {formData.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
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
                  value={activeCommunityId}
                  onChange={(e) => {
                    setSelectedCommunityId(e.target.value);
                    setFormData((current) => ({ ...current, towerId: '' }));
                  }}
                  disabled={communitiesLoading || availableCommunities.length === 0}
                  className="w-full bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
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
                  onChange={(e) => setFormData((current) => ({ ...current, towerId: e.target.value }))}
                  disabled={!activeCommunityId || availableTowers.length === 0}
                  className="w-full bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
                >
                  <option value="">
                    {!activeCommunityId ? 'Select community first' : 'Select tower'}
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
                'flex-1 px-4 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors flex items-center justify-center shadow-lg shadow-amber-500/20',
                mutation.isPending && 'opacity-70 cursor-not-allowed'
              )}
            >
              {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
