'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { SubscriptionPlan } from '@/types';
import { Loader2, Plus, Star } from 'lucide-react';

export default function SubscriptionsPage() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => apiClient.get<SubscriptionPlan[]>('/subscription-plans').then(res => res.data)
  });

  return (
    <div className="space-y-8 p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 font-medium">Manage pricing tiers and customer packages</p>
        </div>
        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 text-sm group">
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Create New Plan
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24 w-full">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : plans?.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No plans found</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm">You haven't created any subscription plans yet. Add one to offer recurring services.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans?.map((plan, index) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-3xl border p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group ${
                index === 1 ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-indigo-500/10' : 'border-gray-100'
              }`}
            >
              {index === 1 && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  Most Popular
                </div>
              )}
              
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform" />
              
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-4xl font-black tracking-tight">${plan.price}</span>
                <span className="ml-1 text-sm font-semibold text-gray-500">/{plan.durationInDays} days</span>
              </div>
              
              <ul className="mt-8 space-y-4">
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Star className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full mt-8 py-3 rounded-xl font-semibold transition-all ${
                  index === 1 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
