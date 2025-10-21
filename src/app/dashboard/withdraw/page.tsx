"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DataTable, { Column, PaginationData } from '@/components/DataTable';
import { Wallet, ArrowUpRight, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Settings {
  depositAddress: string;
  networks: Array<{
    name: string;
    enabled: boolean;
    minDeposit: number;
    minWithdrawal: number;
    confirmations: number;
  }>;
}

interface Withdrawal {
  _id: string;
  amount: number;
  network: string;
  type: 'on-chain' | 'internal';
  destination: string;
  destinationType?: 'address' | 'email';
  status: 'pending' | 'approved' | 'declined';
  note?: string;
  adminNote?: string;
  createdAt: string;
}

interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
  pagination: PaginationData;
}

export default function WithdrawPage() {
  const router = useRouter();
  const { user, isAuthenticated, getToken } = useAuth();
  const [mainTab, setMainTab] = useState<'withdraw' | 'history'>('withdraw');
  const [activeTab, setActiveTab] = useState<'onchain' | 'internal'>('onchain');
  const [internalTab, setInternalTab] = useState<'address' | 'email'>('address');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [userData, setUserData] = useState<{ balances: { WETH: number; ETH: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // Form states
  const [network, setNetwork] = useState('WETH');
  const [amount, setAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    fetchData();
    if (mainTab === 'history') {
      fetchWithdrawals();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router, mainTab, searchQuery, sortBy, sortOrder, pagination.currentPage]);

  const fetchData = async () => {
    try {
      const token = getToken();
      
      // Fetch settings
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // Fetch user profile
      const profileRes = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserData(profileData.user);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const token = getToken();
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchQuery,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/withdrawals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: WithdrawalsResponse = await response.json();
        // API now returns { withdrawals: [], pagination: {} }
        setWithdrawals(data.withdrawals || data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={18} />;
      case 'approved':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'declined':
        return <XCircle className="text-red-500" size={18} />;
      default:
        return null;
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const columns: Column<Withdrawal>[] = [
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (withdrawal) => (
        <div>
          <p className="font-semibold text-gray-900">{withdrawal.amount} {withdrawal.network}</p>
          <p className="text-xs text-gray-500">{withdrawal.network}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (withdrawal) => (
        <span className="capitalize">{withdrawal.type}</span>
      )
    },
    {
      key: 'destination',
      label: 'Destination',
      render: (withdrawal) => (
        <div>
          <p className="text-sm font-mono">
            {withdrawal.destinationType === 'email' 
              ? withdrawal.destination 
              : `${withdrawal.destination.slice(0, 10)}...${withdrawal.destination.slice(-8)}`
            }
          </p>
          <p className="text-xs text-gray-500">
            {withdrawal.destinationType === 'email' ? 'Email' : 'Address'}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (withdrawal) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(withdrawal.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
            {withdrawal.status}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (withdrawal) => (
        <span className="text-sm text-gray-500">
          {new Date(withdrawal.createdAt).toLocaleString()}
        </span>
      )
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const networkSettings = settings?.networks.find(n => n.name === network);
    if (!networkSettings) {
      setError('Invalid network selected');
      return;
    }

    if (numAmount < networkSettings.minWithdrawal) {
      setError(`Minimum withdrawal is ${networkSettings.minWithdrawal} ${network}`);
      return;
    }

    const networkBalance = userData?.balances?.[network as 'WETH' | 'ETH'] || 0;
    if (numAmount > networkBalance) {
      setError(`Insufficient ${network} balance`);
      return;
    }

    if (activeTab === 'onchain' && !withdrawalAddress.trim()) {
      setError('Please enter withdrawal address');
      return;
    }

    if (activeTab === 'internal') {
      if (internalTab === 'email' && !recipientEmail.trim()) {
        setError('Please enter recipient email');
        return;
      }
      if (internalTab === 'address' && !withdrawalAddress.trim()) {
        setError('Please enter recipient address');
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = getToken();
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          network,
          type: activeTab === 'onchain' ? 'on-chain' : 'internal', // Convert to match model enum
          destination: activeTab === 'internal' && internalTab === 'email' 
            ? recipientEmail 
            : withdrawalAddress,
          destinationType: activeTab === 'internal' ? internalTab : 'address',
          note: note.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Withdrawal request submitted successfully! You will receive an email once it is processed.');
        setAmount('');
        setWithdrawalAddress('');
        setRecipientEmail('');
        setNote('');
        
        // Refresh user data
        fetchData();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit withdrawal');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const selectedNetwork = settings?.networks.find(n => n.name === network);
  const networkBalance = userData?.balances?.[network as 'WETH' | 'ETH'] || 0;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Withdrawal</h1>

          {/* Main Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setMainTab('withdraw')}
                className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                  mainTab === 'withdraw'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                New Withdrawal
                {mainTab === 'withdraw' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button
                onClick={() => setMainTab('history')}
                className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                  mainTab === 'history'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Withdrawal History
                {mainTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Withdrawal Form Tab */}
          {mainTab === 'withdraw' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('onchain')}
                className={`pb-3 px-4 font-semibold transition-colors relative ${
                  activeTab === 'onchain'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet size={18} />
                  On chain
                </div>
                {activeTab === 'onchain' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('internal')}
                className={`pb-3 px-4 font-semibold transition-colors relative ${
                  activeTab === 'internal'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  Internal
                </div>
                {activeTab === 'internal' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>

            {/* Info Text */}
            {activeTab === 'onchain' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">What is on chain transaction?</h3>
                <p className="text-sm text-blue-800">
                  On chain transaction is a type of transaction that makes use of the blockchain to transfer coins from one wallet to the other.{' '}
                  <span className="text-blue-600 cursor-pointer hover:underline">learn more</span>
                </p>
              </div>
            )}

            {activeTab === 'internal' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">What is internal transaction?</h3>
                <p className="text-sm text-blue-800">
                  Internal transactions are transactions between users within the app. It would not be processed through the blockchain and requires no gas fee.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Internal Sub-tabs */}
              {activeTab === 'internal' && (
                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setInternalTab('address')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      internalTab === 'address'
                        ? 'bg-gray-200 text-gray-900'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setInternalTab('email')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      internalTab === 'email'
                        ? 'bg-gray-200 text-gray-900'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Email
                  </button>
                </div>
              )}

              {/* Withdrawal Address or Email */}
              {activeTab === 'onchain' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={withdrawalAddress}
                      onChange={(e) => setWithdrawalAddress(e.target.value)}
                      placeholder="Enter withdrawal address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      Paste
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'internal' && internalTab === 'address' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User deposit Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={withdrawalAddress}
                      onChange={(e) => setWithdrawalAddress(e.target.value)}
                      placeholder="Enter recipient's deposit address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      Paste
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'internal' && internalTab === 'email' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Enter recipient's email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Network Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network
                </label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                >
                  {settings?.networks
                    .filter(n => n.enabled)
                    .map((n) => (
                      <option key={n.name} value={n.name}>
                        {n.name}
                      </option>
                    ))}
                </select>
                {selectedNetwork && (
                  <p className="text-xs text-gray-500 mt-2">
                    Available balance: <span className="font-semibold">{networkBalance.toFixed(8)} {network}</span>
                  </p>
                )}
              </div>

              {/* Withdrawal Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {selectedNetwork && (
                  <p className="text-xs text-red-600 mt-2">
                    Min {selectedNetwork.minWithdrawal}
                  </p>
                )}
              </div>

              {/* Note (optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={18} />
                    Withdraw
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                {activeTab === 'onchain' 
                  ? 'Withdrawal might take up to 30 minutes to be completely processed'
                  : 'Internal withdrawals are processed instantly once approved'
                }
              </p>
            </form>
            </div>
          )}

          {/* Withdrawal History Tab */}
          {mainTab === 'history' && (
            <DataTable
              columns={columns}
              data={withdrawals}
              loading={loadingWithdrawals}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onSort={handleSort}
              searchQuery={searchQuery}
              sortBy={sortBy}
              sortOrder={sortOrder}
              searchPlaceholder="Search by destination or network..."
              emptyMessage="No withdrawal history yet"
            />
          )}
      </div>
    </div>
  );
}
