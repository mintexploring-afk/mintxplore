"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, CheckCircle, XCircle, Users, Wallet, Eye } from 'lucide-react';
import DataTable, { Column, PaginationData } from '@/components/DataTable';

interface Withdrawal {
  _id: string;
  user: { name: string; email: string };
  amount: number;
  network: string;
  type: 'on-chain' | 'internal';
  destination: string;
  destinationType?: 'address' | 'email';
  note?: string;
  status: 'pending' | 'approved' | 'declined';
  adminNote?: string;
  processedBy?: { name: string; email: string };
  processedAt?: string;
  createdAt: string;
}

interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
  pagination: PaginationData;
}

interface TabState {
  data: Withdrawal[];
  loading: boolean;
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pagination: PaginationData;
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const [tabStates, setTabStates] = useState<Record<string, TabState>>({
    all: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    pending: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    approved: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    declined: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    }
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

    fetchWithdrawals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, activeFilter, tabStates[activeFilter].searchQuery, tabStates[activeFilter].sortBy, tabStates[activeFilter].sortOrder, tabStates[activeFilter].pagination.currentPage]);

  const fetchWithdrawals = async () => {
    const currentState = tabStates[activeFilter];
    
    setTabStates(prev => ({
      ...prev,
      [activeFilter]: { ...prev[activeFilter], loading: true }
    }));

    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: currentState.pagination.currentPage.toString(),
        limit: currentState.pagination.itemsPerPage.toString(),
        search: currentState.searchQuery,
        sortBy: currentState.sortBy,
        sortOrder: currentState.sortOrder
      });

      if (activeFilter !== 'all') {
        params.append('status', activeFilter);
      }

      const response = await fetch(`/api/admin/withdrawals?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data: WithdrawalsResponse = await response.json();
        setTabStates(prev => ({
          ...prev,
          [activeFilter]: {
            ...prev[activeFilter],
            data: data.withdrawals,
            pagination: data.pagination,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setTabStates(prev => ({
        ...prev,
        [activeFilter]: { ...prev[activeFilter], loading: false }
      }));
    }
  };

  const handleProcess = async (status: 'approved' | 'declined') => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      const token = getToken();
      const response = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal._id,
          status,
          adminNote,
        }),
      });

      if (response.ok) {
        alert(`Withdrawal ${status} successfully!`);
        setShowModal(false);
        setSelectedWithdrawal(null);
        setAdminNote('');
        fetchWithdrawals();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handlePageChange = (page: number) => {
    setTabStates(prev => ({
      ...prev,
      [activeFilter]: {
        ...prev[activeFilter],
        pagination: { ...prev[activeFilter].pagination, currentPage: page }
      }
    }));
  };

  const handleSearch = (query: string) => {
    setTabStates(prev => ({
      ...prev,
      [activeFilter]: {
        ...prev[activeFilter],
        searchQuery: query,
        pagination: { ...prev[activeFilter].pagination, currentPage: 1 }
      }
    }));
  };

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setTabStates(prev => ({
      ...prev,
      [activeFilter]: {
        ...prev[activeFilter],
        sortBy: key,
        sortOrder: order,
        pagination: { ...prev[activeFilter].pagination, currentPage: 1 }
      }
    }));
  };

  const currentState = tabStates[activeFilter];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'declined':
        return <XCircle className="text-red-500" size={18} />;
      default:
        return <Clock className="text-yellow-500" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const columns: Column<Withdrawal>[] = [
    {
      key: 'user.name',
      label: 'User',
      sortable: true,
      render: (withdrawal) => (
        <div>
          <p className="font-medium text-gray-900">{withdrawal.user.name}</p>
          <p className="text-sm text-gray-500">{withdrawal.user.email}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (withdrawal) => (
        <div className="flex items-center gap-2">
          {withdrawal.type === 'on-chain' ? (
            <Wallet size={16} className="text-blue-600" />
          ) : (
            <Users size={16} className="text-purple-600" />
          )}
          <span className="text-sm capitalize">{withdrawal.type}</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (withdrawal) => (
        <div>
          <p className="font-semibold text-gray-900">{withdrawal.amount} {withdrawal.network}</p>
        </div>
      )
    },
    {
      key: 'destination',
      label: 'Destination',
      render: (withdrawal) => (
        <div className="max-w-xs">
          <p className="text-xs text-gray-600 truncate font-mono">
            {withdrawal.destinationType === 'email' 
              ? withdrawal.destination 
              : `${withdrawal.destination.slice(0, 10)}...${withdrawal.destination.slice(-8)}`
            }
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
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (withdrawal) => (
        <button
          onClick={() => {
            setSelectedWithdrawal(withdrawal);
            setAdminNote(withdrawal.adminNote || '');
            setShowModal(true);
          }}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Eye size={16} />
          View
        </button>
      )
    }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Withdrawals Management</h1>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {(['all', 'pending', 'approved', 'declined'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                activeFilter === tab
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeFilter === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={currentState.data}
        loading={currentState.loading}
        pagination={currentState.pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        searchQuery={currentState.searchQuery}
        sortBy={currentState.sortBy}
        sortOrder={currentState.sortOrder}
        searchPlaceholder="Search by user, destination, or amount..."
        emptyMessage="No withdrawals found"
      />

      {/* View/Process Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Withdrawal Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">User</label>
                  <p className="text-gray-900">{selectedWithdrawal.user.name}</p>
                  <p className="text-sm text-gray-500">{selectedWithdrawal.user.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedWithdrawal.type === 'on-chain' ? (
                      <>
                        <Wallet size={18} className="text-blue-600" />
                        <span className="text-gray-900 capitalize">{selectedWithdrawal.type}</span>
                      </>
                    ) : (
                      <>
                        <Users size={18} className="text-purple-600" />
                        <span className="text-gray-900 capitalize">{selectedWithdrawal.type}</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedWithdrawal.amount} {selectedWithdrawal.network}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Destination</label>
                  <p className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-2 rounded">
                    {selectedWithdrawal.destination}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedWithdrawal.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedWithdrawal.status)}`}>
                      {selectedWithdrawal.status}
                    </span>
                  </div>
                </div>

                {selectedWithdrawal.note && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">User Note</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded">{selectedWithdrawal.note}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Submitted</label>
                  <p className="text-gray-900">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</p>
                </div>

                {selectedWithdrawal.processedBy && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Processed By</label>
                      <p className="text-gray-900">{selectedWithdrawal.processedBy.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Processed At</label>
                      <p className="text-gray-900">{selectedWithdrawal.processedAt ? new Date(selectedWithdrawal.processedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Admin Note</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add admin note..."
                    rows={3}
                    disabled={selectedWithdrawal.status !== 'pending'}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {selectedWithdrawal.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleProcess('approved')}
                      disabled={processing}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleProcess('declined')}
                      disabled={processing}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Decline'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedWithdrawal(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
