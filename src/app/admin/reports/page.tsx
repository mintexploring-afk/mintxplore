"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft,
  Package,
  Mail,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';

type TimeFrame = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

interface DetailedStats {
  // Users
  users: {
    total: number;
    new: number;
    active: number;
    emailVerified: number;
    byRole: { admin: number; user: number };
    avgBalanceWETH: number;
    avgBalanceETH: number;
    topHolders: Array<{ name: string; balance: number }>;
  };
  
  // NFTs
  nfts: {
    total: number;
    pending: number;
    approved: number;
    declined: number;
    active: number;
    avgFloorPrice: number;
    totalMintFees: number;
    byCategory: Array<{ name: string; count: number }>;
    recentlyMinted: number;
  };
  
  // Deposits
  deposits: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    totalAmount: number;
    avgAmount: number;
    byCurrency: Record<string, number>;
  };
  
  // Withdrawals
  withdrawals: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    totalAmount: number;
    avgAmount: number;
    byCurrency: Record<string, number>;
  };
  
  // Transactions
  transactions: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalVolume: number;
  };
  
  // Newsletter
  newsletter: {
    totalSubscribers: number;
    activeSubscribers: number;
    inactiveSubscribers: number;
    subscriptionRate: number;
    recentSubscriptions: number;
  };
  
  // Categories
  categories: {
    total: number;
    active: number;
    inactive: number;
    avgMinFloorPrice: number;
    avgMintFee: number;
  };
  
  // Financial Summary
  financial: {
    netFlow: number;
    platformBalance: { WETH: number; ETH: number };
    totalRevenue: number;
    pendingValue: number;
  };
  
  // Time comparison
  comparison?: {
    users: number;
    nfts: number;
    deposits: number;
    withdrawals: number;
  };
}

export default function AdminReportsPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [customRange, setCustomRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  useEffect(() => {
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFrame, customRange]);

  const getDateRange = (): { start: Date; end: Date } => {
    const end = new Date();
    let start = new Date();

    switch (timeFrame) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'custom':
        return customRange;
      case 'all':
        start = new Date(0); // Unix epoch
        break;
    }

    return { start, end };
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const range = getDateRange();
      
      const params = new URLSearchParams({
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      });

      const response = await fetch(`/api/admin/stats/detailed?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.0000';
    }
    return amount.toFixed(4);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'custom': return 'Custom Range';
      case 'all': return 'All Time';
    }
  };

  const handleExport = () => {
    if (!stats) return;
    
    // Create CSV content
    const csvRows: string[] = [];
    
    // Add header
    csvRows.push('MintXplore Platform Report');
    csvRows.push(`Generated: ${new Date().toISOString()}`);
    csvRows.push(`Time Frame: ${getTimeFrameLabel()}`);
    csvRows.push('');
    
    // Users Section
    csvRows.push('=== USER ANALYTICS ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Users,${stats.users.total}`);
    csvRows.push(`New Users,${stats.users.new}`);
    csvRows.push(`Active Users,${stats.users.active}`);
    csvRows.push(`Email Verified,${stats.users.emailVerified}`);
    csvRows.push(`Admin Users,${stats.users.byRole.admin}`);
    csvRows.push(`Regular Users,${stats.users.byRole.user}`);
    csvRows.push(`Average Balance WETH,${stats.users.avgBalanceWETH}`);
    csvRows.push(`Average Balance ETH,${stats.users.avgBalanceETH}`);
    csvRows.push('');
    
    // Top Holders
    csvRows.push('Top Holders');
    csvRows.push('Name,Balance');
    stats.users.topHolders.forEach(holder => {
      csvRows.push(`"${holder.name}",${holder.balance}`);
    });
    csvRows.push('');
    
    // NFTs Section
    csvRows.push('=== NFT ANALYTICS ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Total NFTs,${stats.nfts.total}`);
    csvRows.push(`Pending NFTs,${stats.nfts.pending}`);
    csvRows.push(`Approved NFTs,${stats.nfts.approved}`);
    csvRows.push(`Declined NFTs,${stats.nfts.declined}`);
    csvRows.push(`Active NFTs,${stats.nfts.active}`);
    csvRows.push(`Recently Minted,${stats.nfts.recentlyMinted}`);
    csvRows.push(`Average Floor Price,${stats.nfts.avgFloorPrice}`);
    csvRows.push(`Total Mint Fees,${stats.nfts.totalMintFees}`);
    csvRows.push('');
    
    // NFTs by Category
    csvRows.push('NFTs by Category');
    csvRows.push('Category,Count');
    stats.nfts.byCategory.forEach(cat => {
      csvRows.push(`"${cat.name}",${cat.count}`);
    });
    csvRows.push('');
    
    // Deposits Section
    csvRows.push('=== DEPOSIT ANALYTICS ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Deposits,${stats.deposits.total}`);
    csvRows.push(`Pending Deposits,${stats.deposits.pending}`);
    csvRows.push(`Completed Deposits,${stats.deposits.completed}`);
    csvRows.push(`Rejected Deposits,${stats.deposits.rejected}`);
    csvRows.push(`Total Amount,${stats.deposits.totalAmount}`);
    csvRows.push(`Average Amount,${stats.deposits.avgAmount}`);
    csvRows.push('');
    
    // Deposits by Network
    csvRows.push('Deposits by Network');
    csvRows.push('Network,Amount');
    Object.entries(stats.deposits.byCurrency).forEach(([network, amount]) => {
      csvRows.push(`${network},${amount}`);
    });
    csvRows.push('');
    
    // Withdrawals Section
    csvRows.push('=== WITHDRAWAL ANALYTICS ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Withdrawals,${stats.withdrawals.total}`);
    csvRows.push(`Pending Withdrawals,${stats.withdrawals.pending}`);
    csvRows.push(`Completed Withdrawals,${stats.withdrawals.completed}`);
    csvRows.push(`Rejected Withdrawals,${stats.withdrawals.rejected}`);
    csvRows.push(`Total Amount,${stats.withdrawals.totalAmount}`);
    csvRows.push(`Average Amount,${stats.withdrawals.avgAmount}`);
    csvRows.push('');
    
    // Withdrawals by Network
    csvRows.push('Withdrawals by Network');
    csvRows.push('Network,Amount');
    Object.entries(stats.withdrawals.byCurrency).forEach(([network, amount]) => {
      csvRows.push(`${network},${amount}`);
    });
    csvRows.push('');
    
    // Transactions Section
    csvRows.push('=== TRANSACTION ANALYTICS ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Transactions,${stats.transactions.total}`);
    csvRows.push(`Total Volume,${stats.transactions.totalVolume}`);
    csvRows.push('');
    
    // Transactions by Type
    csvRows.push('Transactions by Type');
    csvRows.push('Type,Count');
    Object.entries(stats.transactions.byType).forEach(([type, count]) => {
      csvRows.push(`${type},${count}`);
    });
    csvRows.push('');
    
    // Transactions by Status
    csvRows.push('Transactions by Status');
    csvRows.push('Status,Count');
    Object.entries(stats.transactions.byStatus).forEach(([status, count]) => {
      csvRows.push(`${status},${count}`);
    });
    csvRows.push('');
    
    // Newsletter Section
    csvRows.push('=== NEWSLETTER ANALYTICS ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Subscribers,${stats.newsletter.totalSubscribers}`);
    csvRows.push(`Active Subscribers,${stats.newsletter.activeSubscribers}`);
    csvRows.push(`Inactive Subscribers,${stats.newsletter.inactiveSubscribers}`);
    csvRows.push(`Subscription Rate,${stats.newsletter.subscriptionRate.toFixed(2)}%`);
    csvRows.push(`Recent Subscriptions,${stats.newsletter.recentSubscriptions}`);
    csvRows.push('');
    
    // Categories Section
    csvRows.push('=== CATEGORY ANALYTICS ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Categories,${stats.categories.total}`);
    csvRows.push(`Active Categories,${stats.categories.active}`);
    csvRows.push(`Inactive Categories,${stats.categories.inactive}`);
    csvRows.push(`Average Min Floor Price,${stats.categories.avgMinFloorPrice}`);
    csvRows.push(`Average Mint Fee,${stats.categories.avgMintFee}`);
    csvRows.push('');
    
    // Financial Summary Section
    csvRows.push('=== FINANCIAL SUMMARY ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Net Flow,${stats.financial.netFlow}`);
    csvRows.push(`Platform Balance WETH,${stats.financial.platformBalance.WETH}`);
    csvRows.push(`Platform Balance ETH,${stats.financial.platformBalance.ETH}`);
    csvRows.push(`Total Revenue,${stats.financial.totalRevenue}`);
    csvRows.push(`Pending Value,${stats.financial.pendingValue}`);
    csvRows.push('');
    
    // Comparison Section
    if (stats.comparison) {
      csvRows.push('=== PERIOD-OVER-PERIOD COMPARISON ===');
      csvRows.push('Metric,Change %');
      csvRows.push(`Users,${stats.comparison.users.toFixed(2)}%`);
      csvRows.push(`NFTs,${stats.comparison.nfts.toFixed(2)}%`);
      csvRows.push(`Deposits,${stats.comparison.deposits.toFixed(2)}%`);
      csvRows.push(`Withdrawals,${stats.comparison.withdrawals.toFixed(2)}%`);
    }
    
    // Create CSV blob and download
    const csvContent = csvRows.join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mintxplore-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comprehensive statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports & Statistics</h1>
        <p className="text-gray-500">Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Statistics</h1>
        <p className="text-gray-600">Comprehensive insights across all platform models</p>
      </div>

      {/* Time Frame Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="text-gray-600" size={20} />
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          
          <button
            onClick={() => setTimeFrame('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFrame === 'today'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          
          <button
            onClick={() => setTimeFrame('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFrame === 'week'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          
          <button
            onClick={() => setTimeFrame('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFrame === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          
          <button
            onClick={() => setTimeFrame('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFrame === 'year'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Year
          </button>
          
          <button
            onClick={() => {
              setTimeFrame('custom');
              setShowCustomPicker(!showCustomPicker);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFrame === 'custom'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
          
          <button
            onClick={() => setTimeFrame('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFrame === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>

          <button
            onClick={handleExport}
            className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>

        {/* Custom Date Picker */}
        {showCustomPicker && timeFrame === 'custom' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customRange.start.toISOString().split('T')[0]}
                onChange={(e) => setCustomRange({ ...customRange, start: new Date(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customRange.end.toISOString().split('T')[0]}
                onChange={(e) => setCustomRange({ ...customRange, end: new Date(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={() => fetchStats()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors mt-5"
            >
              Apply
            </button>
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600">
          Showing data for: <span className="font-semibold text-gray-900">{getTimeFrameLabel()}</span>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={28} />
            {stats.comparison && stats.comparison.deposits !== 0 && (
              <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                {stats.comparison.deposits > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {formatPercentage(stats.comparison.deposits)}
              </div>
            )}
          </div>
          <p className="text-green-100 text-xs mb-1">Total Deposits</p>
          <p className="text-3xl font-bold mb-1">{stats.deposits.total}</p>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{formatCurrency(stats.deposits.totalAmount)} WETH</p>
            <p className="text-sm text-green-100">≈ {formatCurrency(stats.deposits.totalAmount)} ETH</p>
          </div>
          <p className="text-green-100 text-xs mt-2">{stats.deposits.pending} pending</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <ArrowUpRight size={28} />
            {stats.comparison && stats.comparison.withdrawals !== 0 && (
              <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                {stats.comparison.withdrawals > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {formatPercentage(stats.comparison.withdrawals)}
              </div>
            )}
          </div>
          <p className="text-red-100 text-xs mb-1">Total Withdrawals</p>
          <p className="text-3xl font-bold mb-1">{stats.withdrawals.total}</p>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{formatCurrency(stats.withdrawals.totalAmount)} WETH</p>
            <p className="text-sm text-red-100">≈ {formatCurrency(stats.withdrawals.totalAmount)} ETH</p>
          </div>
          <p className="text-red-100 text-xs mt-2">{stats.withdrawals.pending} pending</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <Activity size={28} />
          </div>
          <p className="text-blue-100 text-xs mb-1">Net Flow</p>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${stats.financial.netFlow >= 0 ? 'text-white' : 'text-red-200'}`}>
              {formatCurrency(Math.abs(stats.financial.netFlow))} WETH
            </p>
            <p className="text-sm text-blue-100">≈ {formatCurrency(Math.abs(stats.financial.netFlow))} ETH</p>
          </div>
          <p className="text-blue-100 text-xs mt-2">
            {stats.financial.netFlow >= 0 ? 'Positive' : 'Negative'} flow
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 size={28} />
          </div>
          <p className="text-purple-100 text-xs mb-1">Total Revenue</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{formatCurrency(stats.financial.totalRevenue)} WETH</p>
            <p className="text-sm text-purple-100">≈ {formatCurrency(stats.financial.totalRevenue)} ETH</p>
          </div>
          <p className="text-purple-100 text-xs mt-2">From mint fees & platform</p>
        </div>
      </div>

      {/* Users Statistics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">User Analytics</h2>
              <p className="text-sm text-gray-600">Platform user insights and demographics</p>
            </div>
          </div>
          {stats.comparison && stats.comparison.users !== 0 && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              stats.comparison.users > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {stats.comparison.users > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-medium">{formatPercentage(stats.comparison.users)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">New Users</p>
            <p className="text-3xl font-bold text-green-600">{stats.users.new}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Active Users</p>
            <p className="text-3xl font-bold text-purple-600">{stats.users.active}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Verified</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.users.emailVerified}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Admins</p>
            <p className="text-3xl font-bold text-orange-600">{stats.users.byRole.admin}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Average Balance per User</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">WETH</span>
                <span className="text-lg font-bold text-indigo-600">{formatCurrency(stats.users.avgBalanceWETH)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ETH</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(stats.users.avgBalanceETH)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Top Balance Holders</p>
            <div className="space-y-2">
              {stats.users.topHolders.slice(0, 3).map((holder, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{holder.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(holder.balance)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NFT Statistics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">NFT Analytics</h2>
              <p className="text-sm text-gray-600">Minting and trading statistics</p>
            </div>
          </div>
          {stats.comparison && stats.comparison.nfts !== 0 && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              stats.comparison.nfts > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {stats.comparison.nfts > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-medium">{formatPercentage(stats.comparison.nfts)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total NFTs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.nfts.total}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock size={14} className="text-yellow-600" />
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.nfts.pending}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle size={14} className="text-green-600" />
              <p className="text-xs text-gray-600">Approved</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.nfts.approved}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <XCircle size={14} className="text-red-600" />
              <p className="text-xs text-gray-600">Declined</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.nfts.declined}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-blue-600">{stats.nfts.active}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Avg Floor Price</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.nfts.avgFloorPrice)} WETH</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Total Mint Fees</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.nfts.totalMintFees)} WETH</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Recently Minted</p>
            <p className="text-2xl font-bold text-purple-600">{stats.nfts.recentlyMinted}</p>
          </div>
        </div>

        {stats.nfts.byCategory.length > 0 && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">NFTs by Category</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.nfts.byCategory.map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{cat.name}</span>
                  <span className="text-sm font-bold text-gray-900">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transactions & Activity */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Deposits Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowDownLeft className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Deposits Breakdown</h3>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-lg font-bold text-green-600">{stats.deposits.completed}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-lg font-bold text-yellow-600">{stats.deposits.pending}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-600">Rejected</span>
              <span className="text-lg font-bold text-red-600">{stats.deposits.rejected}</span>
            </div>
          </div>

          <div className="p-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Average Deposit Amount</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.deposits.avgAmount)} WETH</p>
            <p className="text-sm text-gray-500">≈ {formatCurrency(stats.deposits.avgAmount)} ETH</p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">By Network</p>
            <div className="space-y-1">
              {Object.entries(stats.deposits.byCurrency || {}).map(([network, amount]) => (
                <div key={network} className="flex justify-between">
                  <span className="text-sm text-gray-600">{network}</span>
                  <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
              {Object.keys(stats.deposits.byCurrency || {}).length === 0 && (
                <p className="text-sm text-gray-400">No deposits yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Withdrawals Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowUpRight className="text-red-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Withdrawals Breakdown</h3>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-lg font-bold text-green-600">{stats.withdrawals.completed}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-lg font-bold text-yellow-600">{stats.withdrawals.pending}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-600">Rejected</span>
              <span className="text-lg font-bold text-red-600">{stats.withdrawals.rejected}</span>
            </div>
          </div>

          <div className="p-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Average Withdrawal Amount</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.withdrawals.avgAmount)} WETH</p>
            <p className="text-sm text-gray-500">≈ {formatCurrency(stats.withdrawals.avgAmount)} ETH</p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">By Network</p>
            <div className="space-y-1">
              {Object.entries(stats.withdrawals.byCurrency || {}).map(([network, amount]) => (
                <div key={network} className="flex justify-between">
                  <span className="text-sm text-gray-600">{network}</span>
                  <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
              {Object.keys(stats.withdrawals.byCurrency || {}).length === 0 && (
                <p className="text-sm text-gray-400">No withdrawals yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Analytics & Newsletter */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Transactions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Activity className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Transaction Analytics</h3>
              <p className="text-xs text-gray-600">All transaction types</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
            <p className="text-4xl font-bold text-gray-900">{stats.transactions.total}</p>
          </div>

          <div className="space-y-2 mb-4">
            {Object.entries(stats.transactions.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600 capitalize">{type.replace(/-/g, ' ')}</span>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total Volume</p>
            <p className="text-xl font-bold text-indigo-600">{formatCurrency(stats.transactions.totalVolume)} WETH</p>
            <p className="text-sm text-indigo-400">≈ {formatCurrency(stats.transactions.totalVolume)} ETH</p>
          </div>
        </div>

        {/* Newsletter Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Newsletter Analytics</h3>
              <p className="text-xs text-gray-600">Subscription metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-600">{stats.newsletter.activeSubscribers}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-gray-600">{stats.newsletter.inactiveSubscribers}</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg mb-4">
            <p className="text-xs text-gray-600 mb-1">Subscription Rate</p>
            <p className="text-3xl font-bold text-blue-600">{stats.newsletter.subscriptionRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-600 mt-1">of all users subscribed</p>
          </div>

          <div className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recent Subscriptions</span>
              <span className="text-xl font-bold text-gray-900">{stats.newsletter.recentSubscriptions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & Platform Balance */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Categories */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChart className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Category Analytics</h3>
              <p className="text-xs text-gray-600">NFT categories overview</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.categories.total}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-600">{stats.categories.active}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-gray-600">{stats.categories.inactive}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Avg Min Floor Price</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.categories.avgMinFloorPrice)} WETH</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Avg Mint Fee</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.categories.avgMintFee)} WETH</p>
            </div>
          </div>
        </div>

        {/* Platform Balance */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign size={28} />
            <div>
              <h3 className="text-xl font-bold">Platform Balance</h3>
              <p className="text-sm text-indigo-100">Total user holdings</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-lg">
              <p className="text-indigo-100 text-xs mb-1">WETH Balance</p>
              <p className="text-4xl font-bold">{formatCurrency(stats.financial.platformBalance.WETH)}</p>
            </div>
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-lg">
              <p className="text-indigo-100 text-xs mb-1">ETH Balance</p>
              <p className="text-4xl font-bold">{formatCurrency(stats.financial.platformBalance.ETH)}</p>
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-indigo-100 text-xs mb-1">Pending Value</p>
            <p className="text-xl font-bold">{formatCurrency(stats.financial.pendingValue)} WETH</p>
            <p className="text-sm text-indigo-100">≈ {formatCurrency(stats.financial.pendingValue)} ETH</p>
            <p className="text-xs text-indigo-100 mt-1">In pending transactions</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Report Generated</p>
            <p className="text-xs text-blue-700">
              Data compiled on {new Date().toLocaleString()} for the selected time period. 
              Statistics are updated in real-time and reflect the current state of the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
