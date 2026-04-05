'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { X, Building2, Loader2, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TowerInput {
  name: string;
}

interface CreateCommunityPayload {
  name: string;
  city: string;
  address: string;
  towers: TowerInput[];
}

export function CreateCommunityModal({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) {
  const [formData, setFormData] = useState<CreateCommunityPayload>({
    name: '',
    city: '',
    address: '',
    towers: [{ name: '' }],
  });

  const mutation = useMutation({
    mutationFn: (data: CreateCommunityPayload) => apiClient.post('/communities', data),
    onSuccess: () => {
      toast.success('Community Created', {
        description: 'The community and tower details were added successfully.',
      });
      setFormData({
        name: '',
        city: '',
        address: '',
        towers: [{ name: '' }],
      });
      onSuccess();
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error('Failed to create community', {
        description: error.response?.data?.message || 'Please check the provided details.',
      });
    }
  });

  const updateTower = (index: number, value: string) => {
    setFormData((current) => ({
      ...current,
      towers: current.towers.map((tower, towerIndex) =>
        towerIndex === index ? { ...tower, name: value } : tower
      ),
    }));
  };

  const addTower = () => {
    setFormData((current) => ({
      ...current,
      towers: [...current.towers, { name: '' }],
    }));
  };

  const removeTower = (index: number) => {
    setFormData((current) => ({
      ...current,
      towers: current.towers.filter((_, towerIndex) => towerIndex !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedPayload = {
      ...formData,
      towers: formData.towers
        .map((tower) => ({ name: tower.name.trim() }))
        .filter((tower) => tower.name.length > 0),
    };

    if (cleanedPayload.towers.length === 0) {
      toast.error('Add at least one tower', {
        description: 'A community should include at least one tower name.',
      });
      return;
    }

    mutation.mutate(cleanedPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-100 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">Add Community</h2>
              <p className="text-xs text-gray-500 font-medium">Create a community with its tower details</p>
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
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Community Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                placeholder="Green Meadows"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                placeholder="Bangalore"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
              placeholder="Whitefield Main Road"
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Towers</h3>
                <p className="text-xs text-gray-500 font-medium">Add one or more tower names for this community</p>
              </div>
              <button
                type="button"
                onClick={addTower}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tower
              </button>
            </div>

            <div className="space-y-3">
              {formData.towers.map((tower, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={tower.name}
                    onChange={(e) => updateTower(index, e.target.value)}
                    className="flex-1 bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                    placeholder={`Tower ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeTower(index)}
                    disabled={formData.towers.length === 1}
                    className={clsx(
                      'p-3 rounded-xl border transition-colors',
                      formData.towers.length === 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200'
                    )}
                    title="Remove tower"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
                'flex-1 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20',
                mutation.isPending && 'opacity-70 cursor-not-allowed'
              )}
            >
              {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
