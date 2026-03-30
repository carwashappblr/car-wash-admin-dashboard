'use client';

import { useState } from 'react';
import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const token = response.data.accessToken;
      
      const decoded: any = jwtDecode(token);
      
      if (decoded.role !== 'ADMIN') {
        toast.error('Access Denied', {
          description: 'Only administrators can access the dashboard.',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Construct user from JWT since backend only returns accessToken
      const userData = {
        id: decoded.sub,
        email: decoded.email || email,
        name: decoded.name || 'Admin User',
        role: decoded.role as any,
        createdAt: new Date().toISOString()
      };
      
      login(token, userData);
      toast.success('Welcome back', {
        description: 'Successfully authenticated.',
      });
    } catch (error: any) {
      toast.error('Authentication Failed', {
        description: error.response?.data?.message || 'Invalid email or password.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid items-center justify-center bg-[#f8f9fc] relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white relative z-10 transition-all">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Please sign in to access the WashAdmin dashboard.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2 group">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl pl-11 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:font-normal placeholder:text-gray-400"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl pl-11 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:font-normal placeholder:text-gray-400"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
