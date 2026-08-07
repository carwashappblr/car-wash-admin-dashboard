'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Machine, UserSubscription, MachineDailyCount, TaskStatus, BulkSchedulePayload, BulkScheduleResponse } from '@/types';
import { toast } from 'sonner';
import { X, CalendarPlus, Loader2, ChevronLeft, ChevronRight, Check, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface ScheduleWashModalProps {
  isOpen: boolean;
  subscription: UserSubscription | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_TASKS_PER_MACHINE_PER_DAY = 10;

export function ScheduleWashModal({ isOpen, subscription, onClose, onSuccess }: ScheduleWashModalProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [machineId, setMachineId] = useState('');
  const [slotId, setSlotId] = useState(subscription?.car?.defaultSlotNumber || '');
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Update default slot when subscription changes
  useEffect(() => {
    if (subscription?.car?.defaultSlotNumber) {
      setSlotId(subscription.car.defaultSlotNumber);
    }
  }, [subscription]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDates([]);
      setMachineId('');
      setNotes('');
      setCurrentMonth(new Date());
    }
  }, [isOpen]);

  // Calculate calendar month dates
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const startDateOfMonth = useMemo(() => new Date(year, month, 1), [year, month]);
  const endDateOfMonth = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  // Fetch active machines
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: () => apiClient.get<Machine[]>('/machines').then((res) => res.data),
    enabled: isOpen,
  });

  const activeMachines = useMemo(() => {
    return Array.isArray(machines) ? machines.filter((m) => m.isActive) : [];
  }, [machines]);

  // Fetch machine daily task counts for the currently displayed month
  const startDateISO = useMemo(() => {
    const d = new Date(year, month, 1);
    return d.toISOString().split('T')[0];
  }, [year, month]);

  const endDateISO = useMemo(() => {
    const d = new Date(year, month + 1, 0);
    return d.toISOString().split('T')[0];
  }, [year, month]);

  const { data: machineCounts } = useQuery<MachineDailyCount[]>({
    queryKey: ['machine-daily-counts', machineId, startDateISO, endDateISO],
    queryFn: () =>
      apiClient
        .get<MachineDailyCount[]>(`/tasks/machine/${machineId}/daily-counts`, {
          params: { startDate: startDateISO, endDate: endDateISO },
        })
        .then((res) => res.data),
    enabled: isOpen && Boolean(machineId),
  });

  // Map machine counts by date string YYYY-MM-DD
  const countsByDateMap = useMemo(() => {
    const map = new Map<string, number>();
    if (Array.isArray(machineCounts)) {
      machineCounts.forEach((item) => {
        map.set(item.date, item.taskCount);
      });
    }
    return map;
  }, [machineCounts]);

  // Map existing tasks for this subscription by date string YYYY-MM-DD
  const existingTasksByDateMap = useMemo(() => {
    const map = new Map<string, { id: string; status: TaskStatus; formattedStatus: string }>();
    if (subscription?.tasks && Array.isArray(subscription.tasks)) {
      subscription.tasks.forEach((t) => {
        if (t.scheduledDate) {
          const dateStr = t.scheduledDate.split('T')[0];
          let formattedStatus = 'Scheduled';
          if (t.status === TaskStatus.COMPLETED) formattedStatus = 'Completed';
          if (t.status === TaskStatus.CANCELLED) formattedStatus = 'Cancelled';
          map.set(dateStr, { id: t.id, status: t.status, formattedStatus });
        }
      });
    }
    return map;
  }, [subscription]);

  // Remaining available wash slots logic
  const existingActiveTasksCount = useMemo(() => {
    if (!subscription?.tasks) return 0;
    return subscription.tasks.filter(
      (t) => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
    ).length;
  }, [subscription]);

  const availableToSchedule = useMemo(() => {
    if (!subscription) return 0;
    return Math.max(0, subscription.remainingWashes - existingActiveTasksCount);
  }, [subscription, existingActiveTasksCount]);

  // Calendar grid days construction
  const calendarDays = useMemo(() => {
    const days: {
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPast: boolean;
      isOutsideSubscriptionRange: boolean;
      existingTask?: { id: string; status: TaskStatus; formattedStatus: string };
      machineCount: number;
      isMachineFull: boolean;
    }[] = [];

    const startDayOfWeek = startDateOfMonth.getDay(); // 0 = Sun
    const totalDaysInMonth = endDateOfMonth.getDate();

    // Today at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Subscription bounds
    const subStartDate = subscription ? new Date(subscription.startDate) : null;
    if (subStartDate) subStartDate.setHours(0, 0, 0, 0);

    const subEndDate = subscription ? new Date(subscription.endDate) : null;
    if (subEndDate) subEndDate.setHours(23, 59, 59, 999);

    // Padding days from previous month
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isPast: d < today,
        isOutsideSubscriptionRange: true,
        machineCount: countsByDateMap.get(dateStr) || 0,
        isMachineFull: (countsByDateMap.get(dateStr) || 0) >= MAX_TASKS_PER_MACHINE_PER_DAY,
      });
    }

    // Days of current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = d < today;

      let isOutsideSubscriptionRange = false;
      if (subStartDate && d < subStartDate) isOutsideSubscriptionRange = true;
      if (subEndDate && d > subEndDate) isOutsideSubscriptionRange = true;

      const existingTask = existingTasksByDateMap.get(dateStr);
      const machineCount = countsByDateMap.get(dateStr) || 0;

      days.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
        isPast,
        isOutsideSubscriptionRange,
        existingTask,
        machineCount,
        isMachineFull: machineCount >= MAX_TASKS_PER_MACHINE_PER_DAY,
      });
    }

    // Fill remaining grid slots to complete last row
    const remainingGridCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingGridCells; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        isPast: d < today,
        isOutsideSubscriptionRange: true,
        machineCount: countsByDateMap.get(dateStr) || 0,
        isMachineFull: (countsByDateMap.get(dateStr) || 0) >= MAX_TASKS_PER_MACHINE_PER_DAY,
      });
    }

    return days;
  }, [
    year,
    month,
    startDateOfMonth,
    endDateOfMonth,
    subscription,
    existingTasksByDateMap,
    countsByDateMap,
  ]);

  // Multi-select toggle handler
  const handleDateClick = (dayObj: (typeof calendarDays)[0]) => {
    if (!dayObj.isCurrentMonth) return;
    if (dayObj.isPast) return;
    if (dayObj.isOutsideSubscriptionRange) return;
    if (dayObj.existingTask) return;
    if (machineId && dayObj.isMachineFull) {
      toast.error('Machine limit reached', {
        description: `This machine already has ${MAX_TASKS_PER_MACHINE_PER_DAY} tasks on this day.`,
      });
      return;
    }

    const dateStr = dayObj.dateStr;
    if (selectedDates.includes(dateStr)) {
      setSelectedDates((prev) => prev.filter((d) => d !== dateStr));
    } else {
      if (selectedDates.length >= availableToSchedule) {
        toast.warning('Maximum washes reached', {
          description: `You can only schedule up to ${availableToSchedule} wash(es) for this subscription.`,
        });
        return;
      }
      setSelectedDates((prev) => [...prev, dateStr].sort());
    }
  };

  // Mutation for bulk scheduling
  const mutation = useMutation<BulkScheduleResponse, Error, BulkSchedulePayload>({
    mutationFn: (payload) => apiClient.post('/tasks/bulk', payload).then((res) => res.data),
    onSuccess: (data) => {
      toast.success(`${data.count} Wash(es) Scheduled Successfully`, {
        description: 'Tasks have been added to the queue.',
      });
      setSelectedDates([]);
      setMachineId('');
      setNotes('');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error('Scheduling Failed', {
        description: error.response?.data?.message || 'Could not schedule tasks.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscription) return;
    if (selectedDates.length === 0) {
      toast.error('Select at least one date', {
        description: 'Please click on one or more days in the calendar to schedule washes.',
      });
      return;
    }

    const payload: BulkSchedulePayload = {
      userId: subscription.userId,
      carId: subscription.carId,
      subscriptionId: subscription.id,
      scheduledDates: selectedDates,
      notes: notes.trim() || `Subscription wash for ${subscription.plan.name}`,
    };

    if (machineId) payload.machineId = machineId;
    if (slotId) payload.slotId = slotId.trim();

    mutation.mutate(payload);
  };

  if (!isOpen || !subscription) return null;

  const monthLabel = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="border-b border-gray-100 flex items-center justify-between p-5 sm:p-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-2xl text-blue-600">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">Bulk Wash Scheduling</h2>
              <p className="text-xs text-gray-500 font-medium">Select multiple days to schedule washes in one go</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer/Car Summary Banner */}
        <div className="bg-gray-50/80 px-6 py-3.5 border-b border-gray-100 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Customer</span>
              <p className="font-semibold text-gray-800 truncate">{subscription.user?.name}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Car Details</span>
              <p className="font-semibold text-gray-800 truncate">
                {subscription.car?.color} {subscription.car?.make} {subscription.car?.model}
              </p>
              <p className="text-[11px] font-mono text-gray-500">{subscription.car?.plateNumber}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 sm:text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Plan & Usage</span>
              <div className="flex sm:justify-end items-center gap-1.5 mt-0.5">
                <span className="font-medium text-gray-700">{subscription.plan?.name}</span>
                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full text-[11px]">
                  {availableToSchedule} left to schedule
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Machine & Slot selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Assign Machine (Optional)</label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                disabled={machinesLoading || activeMachines.length === 0}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
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
                placeholder={subscription.car?.defaultSlotNumber || 'e.g. B-12'}
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
              />
            </div>
          </div>

          {/* Calendar Header & Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base">{monthLabel}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-semibold">
                  {selectedDates.length} of {availableToSchedule} selected
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 border-t border-gray-100 pt-2 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                <span>Completed</span>
              </div>
              {machineId && (
                <div className="flex items-center gap-1.5 ml-auto text-gray-600">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Machine workload shown per date (max {MAX_TASKS_PER_MACHINE_PER_DAY})</span>
                </div>
              )}
            </div>

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-gray-400 uppercase tracking-wider pt-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((dayObj, idx) => {
                const isSelected = selectedDates.includes(dayObj.dateStr);
                const isExisting = Boolean(dayObj.existingTask);
                const isDisabled = Boolean(
                  !dayObj.isCurrentMonth ||
                    dayObj.isPast ||
                    dayObj.isOutsideSubscriptionRange ||
                    isExisting ||
                    (machineId && dayObj.isMachineFull && !isSelected),
                );

                return (
                  <button
                    key={`${dayObj.dateStr}-${idx}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDateClick(dayObj)}
                    title={
                      isExisting
                        ? `Status: ${dayObj.existingTask?.formattedStatus}`
                        : dayObj.isPast
                        ? 'Past date'
                        : dayObj.isOutsideSubscriptionRange
                        ? 'Outside subscription range'
                        : machineId && dayObj.isMachineFull
                        ? 'Machine limit reached (10/10)'
                        : dayObj.dateStr
                    }
                    className={clsx(
                      'relative h-14 rounded-xl p-1 flex flex-col justify-between items-center transition-all border text-left text-xs font-semibold group',
                      !dayObj.isCurrentMonth && 'opacity-25 bg-gray-50/30 border-transparent',
                      dayObj.isCurrentMonth && !isDisabled && !isSelected && 'hover:border-blue-400 hover:bg-blue-50/40 bg-gray-50/50 border-gray-200 text-gray-800',
                      isSelected && 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30',
                      isExisting && dayObj.existingTask?.status === TaskStatus.COMPLETED && 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed',
                      isExisting && (dayObj.existingTask?.status === TaskStatus.PENDING || dayObj.existingTask?.status === TaskStatus.IN_PROGRESS) && 'bg-emerald-50 border-emerald-200 text-emerald-800 cursor-not-allowed',
                      isExisting && dayObj.existingTask?.status === TaskStatus.CANCELLED && 'bg-red-50 border-red-100 text-red-400 cursor-not-allowed line-through',
                      dayObj.isPast && !isExisting && 'opacity-40 bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed',
                      dayObj.isOutsideSubscriptionRange && !isExisting && 'opacity-30 bg-gray-50 border-transparent text-gray-300 cursor-not-allowed'
                    )}
                  >
                    {/* Top Row: Day number & Existing status icon */}
                    <div className="w-full flex items-center justify-between">
                      <span className={clsx('text-[11px] font-bold', dayObj.isToday && !isSelected && 'text-blue-600 underline font-black')}>
                        {dayObj.dayNumber}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      {isExisting && dayObj.existingTask?.status === TaskStatus.COMPLETED && (
                        <span className="text-[10px] text-gray-500 font-bold">✓</span>
                      )}
                      {isExisting && (dayObj.existingTask?.status === TaskStatus.PENDING || dayObj.existingTask?.status === TaskStatus.IN_PROGRESS) && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      )}
                    </div>

                    {/* Bottom Row: Machine Workload Badge / Existing label */}
                    <div className="w-full flex justify-center text-[9px] font-mono leading-none">
                      {isExisting ? (
                        <span className="truncate text-[9px] font-medium opacity-80">
                          {dayObj.existingTask?.formattedStatus}
                        </span>
                      ) : machineId && dayObj.isCurrentMonth && !dayObj.isPast ? (
                        <span
                          className={clsx(
                            'px-1 py-0.5 rounded text-[9px] font-bold truncate',
                            isSelected
                              ? 'bg-blue-700 text-white'
                              : dayObj.isMachineFull
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : dayObj.machineCount >= 7
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-white/80 border border-gray-200 text-gray-600'
                          )}
                        >
                          {dayObj.isMachineFull ? 'Full (10)' : `${dayObj.machineCount}/10`}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Notes (Optional)</label>
            <textarea
              placeholder="Any specific instructions for these washes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || selectedDates.length === 0}
            className={clsx(
              'flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20',
              (mutation.isPending || selectedDates.length === 0) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `Confirm (${selectedDates.length} Wash${selectedDates.length === 1 ? '' : 'es'})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
