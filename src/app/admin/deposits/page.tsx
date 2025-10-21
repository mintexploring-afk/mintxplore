'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import DataTable, { Column, PaginationData } from '@/components/DataTable';

interface Deposit {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  network: string;
  proofFiles: string[];
  note?: string;
  status: 'pending' | 'approved' | 'declined';
  adminNote?: string;
  processedBy?: {
    name: string;
    email: string;
  };
  processedAt?: string;
  createdAt: string;
}

interface DepositsResponse {
  deposits: Deposit[];
  pagination: PaginationData;
}

// Separate state for each tab
interface TabState {
  data: Deposit[];
  loading: boolean;
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pagination: PaginationData;
}

export default function AdminDepositsPage() {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Separate state for each filter tab
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

    fetchDeposits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, activeFilter, tabStates[activeFilter].searchQuery, tabStates[activeFilter].sortBy, tabStates[activeFilter].sortOrder, tabStates[activeFilter].pagination.currentPage]);

  const fetchDeposits = async () => {
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

      const response = await fetch(`/api/admin/deposits?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data: DepositsResponse = await response.json();
        setTabStates(prev => ({
          ...prev,
          [activeFilter]: {
            ...prev[activeFilter],
            data: data.deposits,
            pagination: data.pagination,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
      setTabStates(prev => ({
        ...prev,
        [activeFilter]: { ...prev[activeFilter], loading: false }
      }));
    }
  };

  const handleProcess = async (depositId: string, status: 'approved' | 'declined') => {
    if (!confirm(`Are you sure you want to ${status === 'approved' ? 'approve' : 'decline'} this deposit?`)) {
      return;
    }

    setProcessing(true);

    try {
      const token = getToken();
      const response = await fetch('/api/admin/deposits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          depositId,
          status,
          adminNote,
        }),
      });

      if (response.ok) {
        alert(`Deposit ${status} successfully!`);
        setShowModal(false);
        setSelectedDeposit(null);
        setAdminNote('');
        fetchDeposits();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process deposit');
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      alert('Failed to process deposit');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'declined':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} />;
      case 'declined':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const columns: Column<Deposit>[] = [
    {
      key: 'user.name',
      label: 'User',
      sortable: true,
      render: (deposit) => (
        <div>
          <p className="font-medium text-gray-900">{deposit.user.name}</p>
          <p className="text-sm text-gray-500">{deposit.user.email}</p>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (deposit) => (
        <div>
          <p className="font-semibold text-gray-900">{deposit.amount} {deposit.network}</p>
          <p className="text-xs text-gray-500">{deposit.network}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (deposit) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(deposit.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
            {deposit.status}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (deposit) => (
        <span className="text-sm text-gray-500">
          {new Date(deposit.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (deposit) => (
        <button
          onClick={() => {
            setSelectedDeposit(deposit);
            setAdminNote(deposit.adminNote || '');
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
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Deposits Management</h1>

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
        searchPlaceholder="Search by user name or email..."
        emptyMessage="No deposits found"
      />

      {/* View/Process Modal */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Deposit Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">User</label>
                  <p className="text-gray-900">{selectedDeposit.user.name}</p>
                  <p className="text-sm text-gray-500">{selectedDeposit.user.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedDeposit.amount} {selectedDeposit.network}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Network</label>
                  <p className="text-gray-900">{selectedDeposit.network}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedDeposit.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDeposit.status)}`}>
                      {selectedDeposit.status}
                    </span>
                  </div>
                </div>

                {selectedDeposit.note && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">User Note</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded">{selectedDeposit.note}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Proof Files</label>
                  <div className="flex gap-2 mt-2">
                    {selectedDeposit.proofFiles.map((file, index) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View File {index + 1}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Submitted</label>
                  <p className="text-gray-900">{new Date(selectedDeposit.createdAt).toLocaleString()}</p>
                </div>

                {selectedDeposit.processedBy && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Processed By</label>
                      <p className="text-gray-900">{selectedDeposit.processedBy.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Processed At</label>
                      <p className="text-gray-900">{selectedDeposit.processedAt ? new Date(selectedDeposit.processedAt).toLocaleString() : 'N/A'}</p>
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
                    disabled={selectedDeposit.status !== 'pending'}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {selectedDeposit.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleProcess(selectedDeposit._id, 'approved')}
                      disabled={processing}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleProcess(selectedDeposit._id, 'declined')}
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
                    setSelectedDeposit(null);
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
