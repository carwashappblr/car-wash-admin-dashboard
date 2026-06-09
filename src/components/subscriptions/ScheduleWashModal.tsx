'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Machine, UserSubscription } from '@/types';
import { toast } from 'sonner';
import { X, CalendarPlus, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ScheduleWashModalProps {
  isOpen: boolean;
  subscription: UserSubscription | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface SchedulePayload {
  userId: string;
  carId: string;
  subscriptionId: string;
  scheduledDate: string;
  machineId?: string;
  slotId?: string;
  isSubscriptionTask: boolean;
  notes?: string;
}

export function ScheduleWashModal({ isOpen, subscription, onClose, onSuccess }: ScheduleWashModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [machineId, setMachineId] = useState('');
  const [slotId, setSlotId] = useState(subscription?.car?.defaultSlotNumber || '');
  const [notes, setNotes] = useState('');

  // Fetch machines to select from
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: () => apiClient.get<Machine[]>('/machines').then((res) => res.data),
    enabled: isOpen,
  });

  const activeMachines = Array.isArray(machines)
    ? machines.filter((m) => m.isActive)
    : [];

  const mutation = useMutation({
    mutationFn: (payload: SchedulePayload) => apiClient.post('/tasks', payload),
    onSuccess: () => {
      toast.success('Wash Scheduled Successfully', {
        description: 'The task has been added to the queue.',
      });
      setScheduledDate('');
      setMachineId('');
      setSlotId('');
      setNotes('');
      onSuccess();
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error('Scheduling Failed', {
        description: error.response?.data?.message || 'Could not schedule task.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscription) return;
    if (!scheduledDate) {
      toast.error('Date required', {
        description: 'Please select a date and time for the wash.',
      });
      return;
    }

    const payload: SchedulePayload = {
      userId: subscription.userId,
      carId: subscription.carId,
      subscriptionId: subscription.id,
      scheduledDate: new Date(scheduledDate).toISOString(),
      isSubscriptionTask: true,
      notes: notes.trim() || `Subscription wash for ${subscription.plan.name}`,
    };

    if (machineId) payload.machineId = machineId;
    if (slotId) payload.slotId = slotId.trim();

    mutation.mutate(payload);
  };

  // Keep slotId state in sync with subscription changes when opened
  useState(() => {
    if (subscription?.car?.defaultSlotNumber) {
      setSlotId(subscription.car.defaultSlotNumber);
    }
  });

  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">Schedule Wash</h2>
              <p className="text-xs text-gray-500 font-medium">Create a new wash task for this subscription</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer/Car Summary Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Customer</span>
              <p className="text-sm font-semibold text-gray-800">{subscription.user?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Car Details</span>
              <p className="text-sm font-semibold text-gray-800">
                {subscription.car?.color} {subscription.car?.make} {subscription.car?.model}
              </p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{subscription.car?.plateNumber}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200/50 pt-2 mt-1">
            <span className="text-xs font-medium text-gray-500">Plan: {subscription.plan?.name}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {subscription.remainingWashes} / {subscription.washCount} washes left
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Date & Time *</label>
            <input 
              type="datetime-local"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Assign Machine (Optional)</label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                disabled={machinesLoading || activeMachines.length === 0}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
              >
                <option value="">Select Machine (None)</option>
                {activeMachines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Slot (Optional)</label>
              <input
                type="text"
                placeholder={subscription.car?.defaultSlotNumber || "e.g. B-12"}
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Notes (Optional)</label>
            <textarea
              placeholder="Any specific instructions for this wash..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 resize-none"
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
                "flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center shadow-lg shadow-blue-500/20",
                mutation.isPending && "opacity-70 cursor-not-allowed"
              )}
            >
              {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Wash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
