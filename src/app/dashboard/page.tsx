"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog, Download, Upload, TrendingUp, Package, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, getToken } = useAuth();
  const [userData, setUserData] = useState<{ balances?: { WETH?: number; ETH?: number } } | null>(null);
  const [nftStats, setNftStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    declined: 0
  });
  const [transactionStats, setTransactionStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  // Check authentication and fetch user data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect admin users to admin dashboard
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    fetchUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router]);

  const fetchUserData = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard: Fetched user data', data);
        setUserData(data.user);
      }

      // Fetch NFT stats
      const nftResponse = await fetch('/api/nfts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (nftResponse.ok) {
        const nftData = await nftResponse.json();
        const nfts = nftData.nfts || [];
        setNftStats({
          total: nfts.length,
          approved: nfts.filter((n: { status: string }) => n.status === 'approved').length,
          pending: nfts.filter((n: { status: string }) => n.status === 'pending').length,
          declined: nfts.filter((n: { status: string }) => n.status === 'declined').length
        });
      }

      // Fetch transaction stats
      const txResponse = await fetch('/api/user/transactions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (txResponse.ok) {
        const txData = await txResponse.json();
        const transactions = txData.transactions || [];
        setTransactionStats({
          totalDeposits: transactions.filter((t: { type: string; status: string }) => t.type === 'deposit' && t.status === 'completed').length,
          totalWithdrawals: transactions.filter((t: { type: string; status: string }) => t.type === 'withdrawal' && t.status === 'completed').length,
          pendingTransactions: transactions.filter((t: { status: string }) => t.status === 'pending').length
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated or loading, show loading state
  if (!isAuthenticated || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const wethBalance = userData?.balances?.WETH || 0;
  const ethBalance = userData?.balances?.ETH || 0;
  
  console.log('💰 Dashboard: Displaying balances', { wethBalance, ethBalance, userData });

  return (
    <div className="p-4 md:p-8 w-full">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 shadow-lg text-white">
                <h3 className="text-sm mb-1 opacity-90">WETH Balance</h3>
                <p className="text-4xl font-bold mb-4">{wethBalance.toFixed(4)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/dashboard/deposit')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
                  >
                    <Download size={16} />
                    Deposit
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/withdraw')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm"
                  >
                    <Upload size={16} />
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 shadow-lg text-white">
                <h3 className="text-sm mb-1 opacity-90">ETH Balance</h3>
                <p className="text-4xl font-bold mb-4">{ethBalance.toFixed(4)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/dashboard/deposit')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
                  >
                    <Download size={16} />
                    Deposit
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/withdraw')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm"
                  >
                    <Upload size={16} />
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* NFT Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div 
                onClick={() => router.push('/dashboard/nfts')}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Package className="text-indigo-600" size={20} />
                  <span className="text-2xl font-bold text-gray-900">{nftStats.total}</span>
                </div>
                <h3 className="text-gray-600 text-xs font-medium">Total NFTs</h3>
              </div>

              <div 
                onClick={() => router.push('/dashboard/nfts?status=approved')}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-2xl font-bold text-gray-900">{nftStats.approved}</span>
                </div>
                <h3 className="text-gray-600 text-xs font-medium">Approved</h3>
              </div>

              <div 
                onClick={() => router.push('/dashboard/nfts?status=pending')}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Clock className="text-yellow-600" size={20} />
                  <span className="text-2xl font-bold text-gray-900">{nftStats.pending}</span>
                </div>
                <h3 className="text-gray-600 text-xs font-medium">Pending</h3>
              </div>

              <div 
                onClick={() => router.push('/dashboard/nfts?status=declined')}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-600 text-xl">✕</span>
                  <span className="text-2xl font-bold text-gray-900">{nftStats.declined}</span>
                </div>
                <h3 className="text-gray-600 text-xs font-medium">Declined</h3>
              </div>
            </div>

            {/* Transaction Stats & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div 
                onClick={() => router.push('/dashboard/transactions?type=deposit')}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Download className="text-green-600" size={20} />
                  <span className="text-2xl font-bold text-gray-900">{transactionStats.totalDeposits}</span>
                </div>
                <h3 className="text-gray-600 text-xs font-medium">Total Deposits</h3>
              </div>
              
              <div 
                onClick={() => router.push('/dashboard/transactions?type=withdrawal')}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Upload className="text-red-600" size={20} />
                  <span className="text-2xl font-bold text-gray-900">{transactionStats.totalWithdrawals}</span>
                </div>
                <h3 className="text-gray-600 text-xs font-medium">Total Withdrawals</h3>
              </div>

              <div 
                onClick={() => router.push('/dashboard/transactions?status=pending')}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Clock className="text-orange-600" size={20} />
                  <span className="text-2xl font-bold text-gray-900">{transactionStats.pendingTransactions}</span>
                </div>
                <h3 className="text-gray-600 text-xs font-medium">Pending Transactions</h3>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/dashboard/mint')}
                className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all flex flex-col items-center gap-2"
              >
                <TrendingUp size={24} />
                <span>Mint NFT</span>
              </button>
              
              <button
                onClick={() => router.push('/edit-profile')}
                className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all flex flex-col items-center gap-2"
              >
                <UserCog size={24} />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/nfts')}
                className="bg-white text-gray-700 py-4 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all flex flex-col items-center gap-2"
              >
                <Package size={24} />
                <span>My NFTs</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/transactions')}
                className="bg-white text-gray-700 py-4 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all flex flex-col items-center gap-2"
              >
                <Clock size={24} />
                <span>History</span>
              </button>
            </div>
    </div>
  );
}
