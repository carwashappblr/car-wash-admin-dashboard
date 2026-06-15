'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Wrench, 
  Briefcase, 
  CreditCard,
  Building2,
  Car
} from 'lucide-react';
import { clsx } from 'clsx';
import { exportToExcel, exportToPdf } from '@/utils/exportUtils';
import { Download } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const STAT_THEMES: Record<string, any> = {
  emerald: { bg: 'bg-emerald-600', lightBg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-200' },
  purple: { bg: 'bg-purple-600', lightBg: 'bg-purple-50', text: 'text-purple-600', border: 'hover:border-purple-200' },
  blue: { bg: 'bg-blue-600', lightBg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-200' },
  orange: { bg: 'bg-orange-600', lightBg: 'bg-orange-50', text: 'text-orange-600', border: 'hover:border-orange-200' },
  indigo: { bg: 'bg-indigo-600', lightBg: 'bg-indigo-50', text: 'text-indigo-600', border: 'hover:border-indigo-200' },
  cyan: { bg: 'bg-cyan-600', lightBg: 'bg-cyan-50', text: 'text-cyan-600', border: 'hover:border-cyan-200' },
  rose: { bg: 'bg-rose-600', lightBg: 'bg-rose-50', text: 'text-rose-600', border: 'hover:border-rose-200' },
  pink: { bg: 'bg-pink-600', lightBg: 'bg-pink-50', text: 'text-pink-600', border: 'hover:border-pink-200' },
  slate: { bg: 'bg-slate-600', lightBg: 'bg-slate-50', text: 'text-slate-600', border: 'hover:border-slate-200' },
};

function StatCard({ title, value, icon: Icon, themeColor = 'blue', loading, subtitle }: any) {
  const t = STAT_THEMES[themeColor] || STAT_THEMES.blue;
  return (
    <div className={`bg-white p-6 rounded-2xl border-2 border-transparent ${t.border} shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all group-hover:scale-150 group-hover:opacity-20 ${t.bg}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{title}</p>
          {loading ? (
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
          ) : (
            <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tight">{value}</h3>
          )}
          {subtitle && !loading && (
             <p className="text-xs text-gray-400 mt-2 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${t.lightBg} ${t.text}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('all-time');

  const dateParams = useMemo(() => {
    const now = new Date();
    let from = undefined;
    const to = undefined;
    if (dateFilter === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (dateFilter === 'last-week') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateFilter === 'last-month') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    return { from, to };
  }, [dateFilter]);

  const { data: overview, isLoading } = useQuery({
    queryKey: ['reports', 'overview', dateParams],
    queryFn: () => reportsApi.getOverview(dateParams),
    enabled: activeTab === 'overview'
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['reports', 'revenue', dateParams],
    queryFn: () => reportsApi.getRevenue(dateParams),
    enabled: activeTab === 'revenue'
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['reports', 'tasks', dateParams],
    queryFn: () => reportsApi.getTasks(dateParams),
    enabled: activeTab === 'tasks'
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['reports', 'subscriptions', dateParams],
    queryFn: () => reportsApi.getSubscriptions(dateParams),
    enabled: activeTab === 'subscriptions'
  });

  const { data: machinesData, isLoading: machinesLoading } = useQuery({
    queryKey: ['reports', 'machines', dateParams],
    queryFn: () => reportsApi.getMachines(dateParams),
    enabled: activeTab === 'machines'
  });

  const handleExportTasks = (format: 'excel' | 'pdf') => {
    if (!tasksData?.data) return;
    if (format === 'excel') {
      const excelData = tasksData.data.map(t => ({
        ID: t.id,
        Status: t.status,
        Date: new Date(t.scheduledDate || t.createdAt).toLocaleDateString(),
        WashType: t.washType?.replace('_', ' ') || 'N/A',
        Car: t.car.plateNumber,
        User: t.user.name,
      }));
      exportToExcel(excelData, 'Tasks_Report');
    } else {
      const headers = ['Status', 'Date', 'Wash Type', 'Car', 'User'];
      const pdfData = tasksData.data.map(t => [
        t.status,
        new Date(t.scheduledDate || t.createdAt).toLocaleDateString(),
        t.washType?.replace('_', ' ') || 'N/A',
        t.car.plateNumber,
        t.user.name
      ]);
      exportToPdf(headers, pdfData, 'Tasks_Report', 'Tasks Report');
    }
  };

  const handleExportSubs = (format: 'excel' | 'pdf') => {
    if (!subsData?.data) return;
    if (format === 'excel') {
      const excelData = subsData.data.map(s => ({
        ID: s.id,
        Status: s.isActive && !s.isExpired ? 'ACTIVE' : 'INACTIVE/EXPIRED',
        Plan: s.plan.name,
        Price: s.computedPrice,
        WashesUsed: s.washesUsed,
        TotalWashes: s.washCount,
        User: s.user.name,
        StartDate: new Date(s.startDate).toLocaleDateString(),
        EndDate: new Date(s.endDate).toLocaleDateString(),
      }));
      exportToExcel(excelData, 'Subscriptions_Report');
    } else {
      const headers = ['Status', 'Plan', 'Price (Rs)', 'Washes', 'User', 'Dates'];
      const pdfData = subsData.data.map(s => [
        s.isActive && !s.isExpired ? 'ACTIVE' : 'INACTIVE',
        s.plan.name,
        s.computedPrice.toString(),
        `${s.washesUsed} / ${s.washCount}`,
        s.user.name,
        `${new Date(s.startDate).toLocaleDateString()} - ${new Date(s.endDate).toLocaleDateString()}`
      ]);
      exportToPdf(headers, pdfData, 'Subscriptions_Report', 'Subscriptions Report');
    }
  };

  const handleExportMachines = (format: 'excel' | 'pdf') => {
    if (!machinesData?.data) return;
    if (format === 'excel') {
      const excelData = machinesData.data.map(m => ({
        ID: m.id,
        Name: m.name,
        Status: m.isActive ? 'ACTIVE' : 'INACTIVE',
        Tower: m.tower?.name || 'Unassigned',
        TotalTasks: m.taskStats.total,
        CompletedTasks: m.taskStats.byStatus['COMPLETED'] || 0,
        CompletionRate: `${m.taskStats.completionRate}%`
      }));
      exportToExcel(excelData, 'Machines_Report');
    } else {
      const headers = ['Name', 'Status', 'Tower', 'Total Tasks', 'Completed', 'Rate'];
      const pdfData = machinesData.data.map(m => [
        m.name,
        m.isActive ? 'ACTIVE' : 'INACTIVE',
        m.tower?.name || 'Unassigned',
        m.taskStats.total.toString(),
        (m.taskStats.byStatus['COMPLETED'] || 0).toString(),
        `${m.taskStats.completionRate}%`
      ]);
      exportToPdf(headers, pdfData, 'Machines_Report', 'Machine Utilization Report');
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'tasks', label: 'Tasks', icon: Briefcase },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'machines', label: 'Machines', icon: Wrench },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Comprehensive business intelligence and platform metrics.</p>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
        >
          <option value="today">Today</option>
          <option value="last-week">Last 7 Days</option>
          <option value="last-month">Last 30 Days</option>
          <option value="all-time">All Time</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-px overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
              activeTab === tab.id 
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" /> Analytics Summary
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Task Status Breakdown</h3>
              <div className="h-64">
                {overview?.tasks.byStatus && Object.keys(overview.tasks.byStatus).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(overview.tasks.byStatus).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={5}
                        label={(entry: any) => entry.name}
                      >
                        {Object.entries(overview.tasks.byStatus).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-500">No data available.</p>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">User Activity Status</h3>
              <div className="h-64">
                {overview?.users ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active Users', value: overview.users.active },
                          { name: 'Inactive Users', value: overview.users.inactive },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={5}
                        label={(entry: any) => entry.name}
                      >
                         <Cell fill="#10b981" />
                         <Cell fill="#94a3b8" />
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-500">No data available.</p>}
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mt-10">
            <TrendingUp className="w-5 h-5 text-green-500" /> Revenue & Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={`₹${overview?.revenue.total.toLocaleString() || 0}`} 
              subtitle={`₹${overview?.revenue.thisMonth.toLocaleString() || 0} this month`}
              icon={TrendingUp} 
              themeColor="emerald" 
              loading={isLoading} 
            />
            <StatCard 
              title="Active Subscriptions" 
              value={overview?.subscriptions.active || 0} 
              subtitle={`${overview?.subscriptions.total || 0} all-time, ${overview?.subscriptions.expiringSoon || 0} expiring soon`}
              icon={CreditCard} 
              themeColor="purple" 
              loading={isLoading} 
            />
             <StatCard 
              title="Users" 
              value={overview?.users.total || 0} 
              subtitle={`${overview?.users.active || 0} active, ${overview?.users.newThisMonth || 0} new this month`}
              icon={Users} 
              themeColor="blue" 
              loading={isLoading} 
            />
          </div>

          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mt-10">
            <Briefcase className="w-5 h-5 text-orange-500" /> Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <StatCard 
              title="Tasks Today" 
              value={overview?.tasks.today || 0} 
              subtitle={`${overview?.tasks.completedToday || 0} completed today`}
              icon={Briefcase} 
              themeColor="orange" 
              loading={isLoading} 
            />
            <StatCard 
              title="Task Completion Rate" 
              value={`${overview?.tasks.completionRate || 0}%`} 
              subtitle={`Out of ${overview?.tasks.total || 0} all-time tasks`}
              icon={BarChart3} 
              themeColor="indigo" 
              loading={isLoading} 
            />
            <StatCard 
              title="Active Machines" 
              value={overview?.machines.active || 0} 
              subtitle={`${overview?.machines.total || 0} total, ${overview?.machines.unassigned || 0} unassigned`}
              icon={Wrench} 
              themeColor="cyan" 
              loading={isLoading} 
            />
          </div>

           <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mt-10">
            <Building2 className="w-5 h-5 text-rose-500" /> Infrastructure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <StatCard 
              title="Communities" 
              value={overview?.infrastructure.communities || 0} 
              icon={Building2} 
              themeColor="rose" 
              loading={isLoading} 
            />
            <StatCard 
              title="Towers" 
              value={overview?.infrastructure.towers || 0} 
              icon={Building2} 
              themeColor="pink" 
              loading={isLoading} 
            />
            <StatCard 
              title="Registered Cars" 
              value={overview?.infrastructure.cars || 0} 
              icon={Car} 
              themeColor="slate" 
              loading={isLoading} 
            />
          </div>

        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-in fade-in">
          {revenueLoading ? (
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Revenue by Plan</h3>
                  <div className="h-64">
                    {revenueData?.byPlan.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueData.byPlan}
                            dataKey="revenue"
                            nameKey="planName"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry: any) => entry.planName}
                          >
                            {revenueData.byPlan.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-gray-500">No data available.</p>}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Revenue by Wash Type</h3>
                  <div className="h-64">
                    {revenueData?.byWashType.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueData.byWashType}
                            dataKey="revenue"
                            nameKey="washType"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry: any) => entry.washType.replace('_', ' ')}
                          >
                            {revenueData.byWashType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-gray-500">No data available.</p>}
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Time Series Revenue</h3>
                 <div className="h-80">
                    {revenueData?.timeSeries.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData.timeSeries}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="period" />
                          <YAxis yAxisId="left" tickFormatter={(value) => `₹${value}`} />
                          <YAxis yAxisId="right" orientation="right" />
                          <RechartsTooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="right" dataKey="count" name="Subscriptions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-gray-500">No data available.</p>}
                  </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6 animate-in fade-in">
           {tasksLoading ? (
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
               <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-gray-900">Recent Tasks</h3>
                 <div className="flex gap-2">
                   <button onClick={() => handleExportTasks('excel')} className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100 flex items-center gap-1 transition-colors"><Download className="w-4 h-4"/> Excel</button>
                   <button onClick={() => handleExportTasks('pdf')} className="text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 flex items-center gap-1 transition-colors"><Download className="w-4 h-4"/> PDF</button>
                 </div>
               </div>
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Wash Type</th>
                      <th className="pb-3 font-medium">Car</th>
                      <th className="pb-3 font-medium">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasksData?.data.map((task) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <span className={clsx(
                            "px-2 py-1 rounded text-xs font-semibold",
                            task.status === 'COMPLETED' ? "bg-green-100 text-green-700" :
                            task.status === 'PENDING' ? "bg-orange-100 text-orange-700" :
                            task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(task.scheduledDate || task.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4 text-gray-800 font-medium">{task.washType?.replace('_', ' ') || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-600">{task.car.plateNumber}</td>
                        <td className="py-3 text-gray-600">{task.user.name}</td>
                      </tr>
                    ))}
                    {!tasksData?.data.length && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No tasks found.</td></tr>}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6 animate-in fade-in">
           {subsLoading ? (
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
               <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-gray-900">Recent Subscriptions</h3>
                 <div className="flex gap-2">
                   <button onClick={() => handleExportSubs('excel')} className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100 flex items-center gap-1 transition-colors"><Download className="w-4 h-4"/> Excel</button>
                   <button onClick={() => handleExportSubs('pdf')} className="text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 flex items-center gap-1 transition-colors"><Download className="w-4 h-4"/> PDF</button>
                 </div>
               </div>
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 font-medium">Washes</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsData?.data.map((sub) => (
                      <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <span className={clsx(
                            "px-2 py-1 rounded text-xs font-semibold",
                            sub.isActive && !sub.isExpired ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {sub.isActive && !sub.isExpired ? 'ACTIVE' : 'INACTIVE/EXPIRED'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-800 font-medium">{sub.plan.name}</td>
                        <td className="py-3 pr-4 text-gray-900 font-bold">₹{sub.computedPrice.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-gray-600">{sub.washesUsed} / {sub.washCount}</td>
                        <td className="py-3 pr-4 text-gray-600">{sub.user.name}</td>
                        <td className="py-3 text-gray-500 text-xs">
                          {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {!subsData?.data.length && <tr><td colSpan={6} className="py-4 text-center text-gray-500">No subscriptions found.</td></tr>}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'machines' && (
        <div className="space-y-6 animate-in fade-in">
           {machinesLoading ? (
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
               <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-gray-900">Machine Utilization</h3>
                 <div className="flex gap-2">
                   <button onClick={() => handleExportMachines('excel')} className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100 flex items-center gap-1 transition-colors"><Download className="w-4 h-4"/> Excel</button>
                   <button onClick={() => handleExportMachines('pdf')} className="text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 flex items-center gap-1 transition-colors"><Download className="w-4 h-4"/> PDF</button>
                 </div>
               </div>
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Machine Name</th>
                      <th className="pb-3 font-medium">Assigned Tower</th>
                      <th className="pb-3 font-medium">Total Tasks</th>
                      <th className="pb-3 font-medium">Completed</th>
                      <th className="pb-3 font-medium">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machinesData?.data.map((machine) => (
                      <tr key={machine.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <span className={clsx(
                            "px-2 py-1 rounded text-xs font-semibold",
                            machine.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {machine.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-800 font-medium">{machine.name}</td>
                        <td className="py-3 pr-4 text-gray-600">{machine.tower?.name || 'Unassigned'}</td>
                        <td className="py-3 pr-4 text-gray-900 font-bold">{machine.taskStats.total}</td>
                        <td className="py-3 pr-4 text-green-600 font-bold">{machine.taskStats.byStatus['COMPLETED'] || 0}</td>
                        <td className="py-3 text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${machine.taskStats.completionRate}%` }}></div>
                            </div>
                            <span className="text-xs font-semibold">{machine.taskStats.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!machinesData?.data.length && <tr><td colSpan={6} className="py-4 text-center text-gray-500">No machines found.</td></tr>}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
