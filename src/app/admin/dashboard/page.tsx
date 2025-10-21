'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Download, Upload, Receipt, Package, CheckCircle, Clock, XCircle, TrendingUp, Mail } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    completedDeposits: 0,
    pendingWithdrawals: 0,
    completedWithdrawals: 0,
    totalTransactions: 0,
    pendingNFTs: 0,
    approvedNFTs: 0,
    declinedNFTs: 0,
    totalNFTs: 0,
    activeSubscribers: 0,
    totalSubscribers: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const fetchStats = async () => {
    try {
      const token = getToken();
      
      // Fetch users count
      const usersRes = await fetch('/api/admin/users?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = usersRes.ok ? await usersRes.json() : { pagination: { totalItems: 0 } };

      // Fetch deposits
      const depositsRes = await fetch('/api/admin/deposits?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const depositsData = depositsRes.ok ? await depositsRes.json() : { deposits: [] };
      const deposits = depositsData.deposits || [];

      // Fetch withdrawals
      const withdrawalsRes = await fetch('/api/admin/withdrawals?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const withdrawalsData = withdrawalsRes.ok ? await withdrawalsRes.json() : { withdrawals: [] };
      const withdrawals = withdrawalsData.withdrawals || [];

      // Fetch NFTs
      const nftsRes = await fetch('/api/nfts?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nftsData = nftsRes.ok ? await nftsRes.json() : { nfts: [] };
      const nfts = nftsData.nfts || [];

      // Fetch newsletter subscribers
      const subscribersRes = await fetch('/api/admin/newsletter/subscribers?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subscribersData = subscribersRes.ok ? await subscribersRes.json() : { pagination: { totalItems: 0 }, subscribers: [] };

      setStats({
        totalUsers: usersData.pagination?.totalItems || 0,
        pendingDeposits: deposits.filter((d: { status: string }) => d.status === 'pending').length,
        completedDeposits: deposits.filter((d: { status: string }) => d.status === 'completed').length,
        pendingWithdrawals: withdrawals.filter((w: { status: string }) => w.status === 'pending').length,
        completedWithdrawals: withdrawals.filter((w: { status: string }) => w.status === 'completed').length,
        totalTransactions: deposits.length + withdrawals.length,
        pendingNFTs: nfts.filter((n: { status: string }) => n.status === 'pending').length,
        approvedNFTs: nfts.filter((n: { status: string }) => n.status === 'approved').length,
        declinedNFTs: nfts.filter((n: { status: string }) => n.status === 'declined').length,
        totalNFTs: nfts.length,
        activeSubscribers: subscribersData.subscribers?.filter((s: { status: string }) => s.status === 'active').length || 0,
        totalSubscribers: subscribersData.pagination?.totalItems || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {/* Users */}
        <div 
          onClick={() => router.push('/admin/users')}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalUsers}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Total Users</h3>
        </div>

        {/* Pending Deposits */}
        <div 
          onClick={() => router.push('/admin/deposits?status=pending')}
          className="bg-white p-4 rounded-lg shadow-sm border border-green-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Download className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{stats.pendingDeposits}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Pending Deposits</h3>
        </div>

        {/* Completed Deposits */}
        <div 
          onClick={() => router.push('/admin/deposits?status=completed')}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.completedDeposits}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Done Deposits</h3>
        </div>

        {/* Pending Withdrawals */}
        <div 
          onClick={() => router.push('/admin/withdrawals?status=pending')}
          className="bg-white p-4 rounded-lg shadow-sm border border-red-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Upload className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600">{stats.pendingWithdrawals}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Pending Withdrawals</h3>
        </div>

        {/* Completed Withdrawals */}
        <div 
          onClick={() => router.push('/admin/withdrawals?status=completed')}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.completedWithdrawals}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Done Withdrawals</h3>
        </div>

        {/* Total Transactions */}
        <div 
          onClick={() => router.push('/admin/transactions')}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">All Transactions</h3>
        </div>
      </div>

      {/* NFT Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => router.push('/admin/nfts?status=pending')}
          className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-600">{stats.pendingNFTs}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Pending NFTs</h3>
        </div>

        <div 
          onClick={() => router.push('/admin/nfts?status=approved')}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.approvedNFTs}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Approved NFTs</h3>
        </div>

        <div 
          onClick={() => router.push('/admin/nfts?status=declined')}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.declinedNFTs}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Declined NFTs</h3>
        </div>

        <div 
          onClick={() => router.push('/admin/nfts')}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalNFTs}</span>
          </div>
          <h3 className="text-gray-600 text-xs font-medium">Total NFTs</h3>
        </div>
      </div>

      {/* Newsletter Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div 
          onClick={() => router.push('/admin/newsletter')}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg shadow-sm border border-blue-200 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <span className="text-3xl font-bold text-blue-900">{stats.activeSubscribers}</span>
          </div>
          <h3 className="text-blue-900 font-semibold">Active Subscribers</h3>
          <p className="text-blue-700 text-xs mt-1">{stats.totalSubscribers} total subscribers</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg shadow-sm border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <span className="text-3xl font-bold text-purple-900">
              {stats.totalUsers > 0 ? Math.round((stats.activeSubscribers / stats.totalUsers) * 100) : 0}%
            </span>
          </div>
          <h3 className="text-purple-900 font-semibold">Subscription Rate</h3>
          <p className="text-purple-700 text-xs mt-1">Active subscribers / Total users</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button
            onClick={() => router.push('/admin/deposits')}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            Deposits
          </button>
          <button
            onClick={() => router.push('/admin/withdrawals')}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            Withdrawals
          </button>
          <button
            onClick={() => router.push('/admin/nfts')}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            NFTs
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            Users
          </button>
          <button
            onClick={() => router.push('/admin/newsletter')}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Newsletter
          </button>
          <button
            onClick={() => router.push('/admin/settings')}
            className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
