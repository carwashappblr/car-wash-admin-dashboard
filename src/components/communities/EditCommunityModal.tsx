'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community } from '@/types';
import { toast } from 'sonner';
import { X, Building2, Loader2, Plus, Trash2, RotateCcw, Pencil } from 'lucide-react';
import { clsx } from 'clsx';

interface EditCommunityModalProps {
  isOpen: boolean;
  community: Community | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditableTower {
  id?: string;
  name: string;
  isActive: boolean;
  isNew: boolean;
  markedForDeletion: boolean;
  originalName: string;
  originalIsActive: boolean;
}

interface EditCommunityPayload {
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  addTowers: Array<{
    name: string;
    isActive: boolean;
  }>;
  updateTowers: Array<{
    id: string;
    name?: string;
    isActive?: boolean;
  }>;
  deleteTowerIds: string[];
}

interface FormState {
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  towers: EditableTower[];
}

const emptyFormState: FormState = {
  name: '',
  city: '',
  address: '',
  isActive: true,
  towers: [],
};

function getInitialState(community: Community | null): FormState {
  if (!community) {
    return emptyFormState;
  }

  return {
    name: community.name,
    city: community.city,
    address: community.address,
    isActive: community.isActive,
    towers: community.towers.map((tower) => ({
      id: tower.id,
      name: tower.name,
      isActive: tower.isActive,
      isNew: false,
      markedForDeletion: false,
      originalName: tower.name,
      originalIsActive: tower.isActive,
    })),
  };
}

export function EditCommunityModal({ isOpen, community, onClose, onSuccess }: EditCommunityModalProps) {
  const [formData, setFormData] = useState<FormState>(() => getInitialState(community));

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditCommunityPayload }) =>
      apiClient.patch(`/communities/${id}`, data),
    onSuccess: () => {
      toast.success('Community Updated', {
        description: 'The community details were updated successfully.',
      });
      onSuccess();
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error('Failed to update community', {
        description: error.response?.data?.message || 'Please review the details and try again.',
      });
    },
  });

  const updateField = (field: 'name' | 'city' | 'address', value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateTower = (index: number, updates: Partial<EditableTower>) => {
    setFormData((current) => ({
      ...current,
      towers: current.towers.map((tower, towerIndex) =>
        towerIndex === index ? { ...tower, ...updates } : tower
      ),
    }));
  };

  const addTower = () => {
    setFormData((current) => ({
      ...current,
      towers: [
        ...current.towers,
        {
          name: '',
          isActive: true,
          isNew: true,
          markedForDeletion: false,
          originalName: '',
          originalIsActive: true,
        },
      ],
    }));
  };

  const removeTower = (index: number) => {
    setFormData((current) => {
      const targetTower = current.towers[index];

      if (!targetTower) {
        return current;
      }

      if (targetTower.isNew) {
        return {
          ...current,
          towers: current.towers.filter((_, towerIndex) => towerIndex !== index),
        };
      }

      return {
        ...current,
        towers: current.towers.map((tower, towerIndex) =>
          towerIndex === index ? { ...tower, markedForDeletion: true } : tower
        ),
      };
    });
  };

  const restoreTower = (index: number) => {
    updateTower(index, { markedForDeletion: false });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!community) {
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedCity = formData.city.trim();
    const trimmedAddress = formData.address.trim();

    if (!trimmedName || !trimmedCity || !trimmedAddress) {
      toast.error('Missing required details', {
        description: 'Community name, city, and address are required.',
      });
      return;
    }

    const towersToKeep = formData.towers.filter((tower) => !tower.markedForDeletion);
    const hasBlankTowerName = towersToKeep.some((tower) => tower.name.trim().length === 0);

    if (hasBlankTowerName) {
      toast.error('Tower name required', {
        description: 'Please add a name for every tower you want to keep.',
      });
      return;
    }

    const addTowers = towersToKeep
      .filter((tower) => tower.isNew)
      .map((tower) => ({
        name: tower.name.trim(),
        isActive: tower.isActive,
      }));

    const updateTowers = formData.towers
      .filter((tower): tower is EditableTower & { id: string } => !tower.isNew && !tower.markedForDeletion && Boolean(tower.id))
      .map((tower) => {
        const trimmedTowerName = tower.name.trim();
        const hasNameChanged = trimmedTowerName !== tower.originalName;
        const hasStatusChanged = tower.isActive !== tower.originalIsActive;

        if (!hasNameChanged && !hasStatusChanged) {
          return null;
        }

        return {
          id: tower.id,
          ...(hasNameChanged ? { name: trimmedTowerName } : {}),
          ...(hasStatusChanged ? { isActive: tower.isActive } : {}),
        };
      })
      .filter((tower): tower is NonNullable<typeof tower> => tower !== null);

    const deleteTowerIds = formData.towers
      .filter((tower): tower is EditableTower & { id: string } => !tower.isNew && tower.markedForDeletion && Boolean(tower.id))
      .map((tower) => tower.id);

    const payload: EditCommunityPayload = {
      name: trimmedName,
      city: trimmedCity,
      address: trimmedAddress,
      isActive: formData.isActive,
      addTowers,
      updateTowers,
      deleteTowerIds,
    };

    mutation.mutate({ id: community.id, data: payload });
  };

  if (!isOpen || !community) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-100 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">Edit Community</h2>
              <p className="text-xs text-gray-500 font-medium">Update community details and manage tower status</p>
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
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                placeholder="Palm Residency"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
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
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
              placeholder="Main Road"
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'h-3 w-3 rounded-full',
                  formData.isActive ? 'bg-green-500' : 'bg-red-500'
                )} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Community Status</h3>
                  <p className="text-xs text-gray-500 font-medium">Enable or disable the whole community</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Towers</h3>
                <p className="text-xs text-gray-500 font-medium">Add, disable, remove, or restore towers</p>
              </div>
              <button
                type="button"
                onClick={addTower}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tower
              </button>
            </div>

            <div className="space-y-3">
              {formData.towers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center">
                  <Building2 className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No towers yet</p>
                  <p className="text-xs text-gray-500 font-medium">Add a tower to include it in this community.</p>
                </div>
              ) : (
                formData.towers.map((tower, index) => (
                  <div
                    key={tower.id ?? `new-${index}`}
                    className={clsx(
                      'rounded-2xl border bg-white p-4 transition-colors',
                      tower.markedForDeletion ? 'border-red-200 bg-red-50/60' : 'border-gray-200'
                    )}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Tower {index + 1}
                        </label>
                        <input
                          type="text"
                          value={tower.name}
                          onChange={(e) => updateTower(index, { name: e.target.value })}
                          disabled={tower.markedForDeletion}
                          className={clsx(
                            'w-full border text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal',
                            tower.markedForDeletion
                              ? 'border-red-200 bg-red-50 text-red-400 line-through'
                              : 'border-gray-200 bg-white focus:ring-amber-500/20 focus:border-amber-500'
                          )}
                          placeholder={`Tower ${index + 1}`}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateTower(index, { isActive: !tower.isActive })}
                          disabled={tower.markedForDeletion}
                          className={clsx(
                            'rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
                            tower.markedForDeletion
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : tower.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                          )}
                        >
                          {tower.isActive ? 'Active' : 'Inactive'}
                        </button>

                        {tower.markedForDeletion ? (
                          <button
                            type="button"
                            onClick={() => restoreTower(index)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Undo
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeTower(index)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {tower.markedForDeletion && (
                      <p className="mt-3 text-xs font-semibold text-red-600">
                        This tower will be deleted when you save changes.
                      </p>
                    )}
                  </div>
                ))
              )}
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
