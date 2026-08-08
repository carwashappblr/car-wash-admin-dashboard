'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  Machine,
  UserSubscription,
  MachineDailyCount,
  TaskStatus,
  BulkModifyPayload,
  BulkModifyResponse,
} from '@/types';
import { toast } from 'sonner';
import { X, CalendarPlus, Loader2, ChevronLeft, ChevronRight, Check, Info, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface ScheduleWashModalProps {
  isOpen: boolean;
  subscription: UserSubscription | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_TASKS_PER_MACHINE_PER_DAY = 10;

export function ScheduleWashModal({
  isOpen,
  subscription,
  onClose,
  onSuccess,
}: ScheduleWashModalProps) {
  const [unselectedPendingTaskIds, setUnselectedPendingTaskIds] = useState<string[]>([]);
  const [newSelectedDates, setNewSelectedDates] = useState<string[]>([]);
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
      setUnselectedPendingTaskIds([]);
      setNewSelectedDates([]);
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

  const communityMachines = useMemo(() => {
    const communityId = subscription?.plan?.communityId;
    if (!communityId) return activeMachines;
    return activeMachines.filter((m) => m.tower?.communityId === communityId);
  }, [activeMachines, subscription]);

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

  // Map existing active/completed tasks for this subscription by date string YYYY-MM-DD
  const existingTasksByDateMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; status: TaskStatus; formattedStatus: string }
    >();
    if (subscription?.tasks && Array.isArray(subscription.tasks)) {
      subscription.tasks.forEach((t) => {
        if (t.scheduledDate && t.status !== TaskStatus.CANCELLED) {
          const dateStr = t.scheduledDate.split('T')[0];
          let formattedStatus = 'Scheduled';
          if (t.status === TaskStatus.COMPLETED) formattedStatus = 'Completed';
          map.set(dateStr, { id: t.id, status: t.status, formattedStatus });
        }
      });
    }
    return map;
  }, [subscription]);

  // Capacity math
  const totalWashCapacity = subscription ? subscription.washCount - subscription.washesUsed : 0;

  const existingPendingTasks = useMemo(() => {
    if (!subscription?.tasks) return [];
    return subscription.tasks.filter((t) => t.status === TaskStatus.PENDING);
  }, [subscription]);

  const existingInProgressTasks = useMemo(() => {
    if (!subscription?.tasks) return [];
    return subscription.tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS);
  }, [subscription]);

  const activePendingCount = existingPendingTasks.length - unselectedPendingTaskIds.length;
  const totalActiveScheduled = activePendingCount + existingInProgressTasks.length + newSelectedDates.length;
  const availableSlotsRemaining = Math.max(0, totalWashCapacity - totalActiveScheduled);

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

    const startDayOfWeek = startDateOfMonth.getDay();
    const totalDaysInMonth = endDateOfMonth.getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subStartDate = subscription ? new Date(subscription.startDate) : null;
    if (subStartDate) subStartDate.setHours(0, 0, 0, 0);

    const subEndDate = subscription ? new Date(subscription.endDate) : null;
    if (subEndDate) subEndDate.setHours(23, 59, 59, 999);

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

  // Click handler for date cells
  const handleDateClick = (dayObj: (typeof calendarDays)[0]) => {
    if (!dayObj.isCurrentMonth || dayObj.isPast || dayObj.isOutsideSubscriptionRange) return;

    if (!machineId) {
      toast.warning('Machine Required', {
        description: 'Please select an assigned machine above before picking dates.',
      });
      return;
    }

    const { existingTask, dateStr } = dayObj;

    // Handle existing tasks
    if (existingTask) {
      if (existingTask.status === TaskStatus.COMPLETED || existingTask.status === TaskStatus.IN_PROGRESS) {
        return; // Locked
      }
      if (existingTask.status === TaskStatus.PENDING) {
        // Toggle unselecting this pending task
        if (unselectedPendingTaskIds.includes(existingTask.id)) {
          // Re-select this task
          setUnselectedPendingTaskIds((prev) => prev.filter((id) => id !== existingTask.id));
        } else {
          // Unselect/Cancel this task
          setUnselectedPendingTaskIds((prev) => [...prev, existingTask.id]);
        }
        return;
      }
    }

    // Handle new date selection
    if (machineId && dayObj.isMachineFull && !newSelectedDates.includes(dateStr)) {
      toast.error('Machine limit reached', {
        description: `This machine already has ${MAX_TASKS_PER_MACHINE_PER_DAY} tasks on this day.`,
      });
      return;
    }

    if (newSelectedDates.includes(dateStr)) {
      setNewSelectedDates((prev) => prev.filter((d) => d !== dateStr));
    } else {
      if (availableSlotsRemaining <= 0) {
        toast.warning('Maximum washes reached', {
          description: `You have reached the maximum allowed washes (${totalWashCapacity}) for this subscription. Unselect a pending date or remove a new selection to free up space.`,
        });
        return;
      }
      setNewSelectedDates((prev) => [...prev, dateStr].sort());
    }
  };

  // Mutation for bulk modification
  const mutation = useMutation<BulkModifyResponse, Error, BulkModifyPayload>({
    mutationFn: (payload) =>
      apiClient.patch('/tasks/bulk-modify', payload).then((res) => res.data),
    onSuccess: (data) => {
      let desc = '';
      if (data.createdCount > 0 && data.cancelledCount > 0) {
        desc = `${data.cancelledCount} wash(es) cancelled, ${data.createdCount} new wash(es) scheduled.`;
      } else if (data.createdCount > 0) {
        desc = `${data.createdCount} new wash(es) scheduled.`;
      } else if (data.cancelledCount > 0) {
        desc = `${data.cancelledCount} wash(es) cancelled.`;
      }

      toast.success('Schedule Updated Successfully', { description: desc });
      setUnselectedPendingTaskIds([]);
      setNewSelectedDates([]);
      setMachineId('');
      setNotes('');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message;
      const description = Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Could not update schedule.');
      toast.error('Schedule Update Failed', { description });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscription) return;
    if (!machineId) {
      toast.error('Machine Required', {
        description: 'Please select an assigned machine before saving the schedule.',
      });
      return;
    }
    if (unselectedPendingTaskIds.length === 0 && newSelectedDates.length === 0) {
      toast.info('No changes made', {
        description: 'You have not selected or unselected any dates.',
      });
      return;
    }

    const payload: BulkModifyPayload = {
      userId: subscription.userId,
      carId: subscription.carId,
      subscriptionId: subscription.id,
      machineId,
      cancelTaskIds: unselectedPendingTaskIds,
      newScheduledDates: newSelectedDates,
      notes: notes.trim() || `Subscription wash schedule update for ${subscription.plan.name}`,
    };

    if (slotId) payload.slotId = slotId.trim();

    mutation.mutate(payload);
  };

  if (!isOpen || !subscription) return null;

  const monthLabel = currentMonth.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const hasChanges = unselectedPendingTaskIds.length > 0 || newSelectedDates.length > 0;

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
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">
                Manage Wash Schedule
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Click pending dates to cancel/reschedule or click open dates to add new washes
              </p>
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
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Subscription Usage</span>
              <div className="flex sm:justify-end items-center gap-1.5 mt-0.5">
                <span className="font-medium text-gray-700">{subscription.plan?.name}</span>
                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full text-[11px]">
                  {totalActiveScheduled} / {totalWashCapacity} active
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
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Assign Machine (Required)</label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                disabled={machinesLoading || communityMachines.length === 0}
                className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
              >
                <option value="">Select Machine (Required)</option>
                {communityMachines.map((machine) => (
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
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-semibold">
                  {totalActiveScheduled} / {totalWashCapacity} scheduled
                  {unselectedPendingTaskIds.length > 0 && (
                    <span className="text-amber-700 ml-1 font-bold">
                      ({unselectedPendingTaskIds.length} cancelling)
                    </span>
                  )}
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
                <span>Selected / Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>To Cancel (Click to restore)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                <span>Completed</span>
              </div>
              {machineId && (
                <div className="flex items-center gap-1.5 ml-auto text-gray-600">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Workload per date (max {MAX_TASKS_PER_MACHINE_PER_DAY})</span>
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
                const { existingTask, dateStr } = dayObj;

                const isNewSelected = newSelectedDates.includes(dateStr);
                const isPendingTask = existingTask && existingTask.status === TaskStatus.PENDING;
                const isUnselectedPending = isPendingTask && unselectedPendingTaskIds.includes(existingTask.id);
                const isSelectedPending = isPendingTask && !isUnselectedPending;
                const isCompleted = existingTask && existingTask.status === TaskStatus.COMPLETED;
                const isInProgress = existingTask && existingTask.status === TaskStatus.IN_PROGRESS;

                const isSelected = isNewSelected || isSelectedPending;
                const isDisabled = Boolean(
                  !dayObj.isCurrentMonth ||
                    dayObj.isPast ||
                    dayObj.isOutsideSubscriptionRange ||
                    isCompleted ||
                    isInProgress ||
                    (machineId && dayObj.isMachineFull && !isSelected),
                );

                return (
                  <button
                    key={`${dateStr}-${idx}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDateClick(dayObj)}
                    title={
                      isCompleted
                        ? 'Completed wash (locked)'
                        : isInProgress
                        ? 'Wash in progress (locked)'
                        : isSelectedPending
                        ? 'Click to cancel/reschedule this wash'
                        : isUnselectedPending
                        ? 'Click to restore this wash'
                        : isNewSelected
                        ? 'Click to unselect'
                        : dayObj.isPast
                        ? 'Past date'
                        : dayObj.isOutsideSubscriptionRange
                        ? 'Outside subscription range'
                        : machineId && dayObj.isMachineFull
                        ? 'Machine limit reached (10/10)'
                        : dateStr
                    }
                    className={clsx(
                      'relative h-14 rounded-xl p-1 flex flex-col justify-between items-center transition-all border text-left text-xs font-semibold group',
                      !dayObj.isCurrentMonth && 'opacity-25 bg-gray-50/30 border-transparent',
                      dayObj.isCurrentMonth && !isDisabled && !isSelected && !isUnselectedPending && 'hover:border-blue-400 hover:bg-blue-50/40 bg-gray-50/50 border-gray-200 text-gray-800',
                      // Selected state (new selection or active pending task)
                      isSelected && 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30',
                      // Unselected pending state (scheduled task marked for cancellation)
                      isUnselectedPending && 'bg-amber-50 border-amber-300 text-amber-900 border-dashed hover:bg-amber-100/70',
                      // Locked existing states
                      isCompleted && 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed',
                      isInProgress && 'bg-emerald-50 border-emerald-200 text-emerald-800 cursor-not-allowed',
                      dayObj.isPast && !existingTask && 'opacity-40 bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed',
                      dayObj.isOutsideSubscriptionRange && !existingTask && 'opacity-30 bg-gray-50 border-transparent text-gray-300 cursor-not-allowed'
                    )}
                  >
                    {/* Top Row: Day number & status icon */}
                    <div className="w-full flex items-center justify-between">
                      <span className={clsx('text-[11px] font-bold', dayObj.isToday && !isSelected && 'text-blue-600 underline font-black')}>
                        {dayObj.dayNumber}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      {isUnselectedPending && <span className="text-[10px] text-amber-700 font-bold">✕</span>}
                      {isCompleted && <span className="text-[10px] text-gray-500 font-bold">✓</span>}
                      {isInProgress && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>}
                    </div>

                    {/* Bottom Row: Machine Workload Badge / Status label */}
                    <div className="w-full flex justify-center text-[9px] font-mono leading-none">
                      {isUnselectedPending ? (
                        <span className="truncate text-[9px] font-bold text-amber-700">Cancelling</span>
                      ) : isSelectedPending ? (
                        <span className="truncate text-[9px] font-medium text-white/90">Scheduled</span>
                      ) : isCompleted ? (
                        <span className="truncate text-[9px] font-medium opacity-80">Completed</span>
                      ) : isInProgress ? (
                        <span className="truncate text-[9px] font-bold text-emerald-700">In Progress</span>
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
            disabled={mutation.isPending || !hasChanges || !machineId}
            className={clsx(
              'flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20',
              (mutation.isPending || !hasChanges || !machineId) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : hasChanges ? (
              `Save Changes (${unselectedPendingTaskIds.length > 0 ? `${unselectedPendingTaskIds.length} cancel` : ''}${
                unselectedPendingTaskIds.length > 0 && newSelectedDates.length > 0 ? ', ' : ''
              }${newSelectedDates.length > 0 ? `${newSelectedDates.length} add` : ''})`
            ) : (
              'No Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
