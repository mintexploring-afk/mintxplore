"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DataTable, { Column, PaginationData } from '@/components/DataTable';
import { ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'nft-purchase' | 'nft-sale';
  amount: number;
  currency: string;
  status: string;
  description?: string;
  note?: string;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: PaginationData;
}

interface TabState {
  data: Transaction[];
  loading: boolean;
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pagination: PaginationData;
}

export default function UserTransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, getToken } = useAuth();
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'nft-purchase' | 'nft-sale'>('all');

  const [tabStates, setTabStates] = useState<Record<string, TabState>>({
    all: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    deposit: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    withdrawal: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    'nft-purchase': {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    'nft-sale': {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router, filter, tabStates[filter].searchQuery, tabStates[filter].sortBy, tabStates[filter].sortOrder, tabStates[filter].pagination.currentPage]);

  const fetchTransactions = async () => {
    const currentState = tabStates[filter];
    
    setTabStates(prev => ({
      ...prev,
      [filter]: { ...prev[filter], loading: true }
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

      if (filter !== 'all') {
        params.append('type', filter);
      }

      const response = await fetch(`/api/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: TransactionsResponse = await response.json();
        setTabStates(prev => ({
          ...prev,
          [filter]: {
            ...prev[filter],
            data: data.transactions,
            pagination: data.pagination,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTabStates(prev => ({
        ...prev,
        [filter]: { ...prev[filter], loading: false }
      }));
    }
  };

  const handlePageChange = (page: number) => {
    setTabStates(prev => ({
      ...prev,
      [filter]: {
        ...prev[filter],
        pagination: { ...prev[filter].pagination, currentPage: page }
      }
    }));
  };

  const handleSearch = (query: string) => {
    setTabStates(prev => ({
      ...prev,
      [filter]: {
        ...prev[filter],
        searchQuery: query,
        pagination: { ...prev[filter].pagination, currentPage: 1 }
      }
    }));
  };

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setTabStates(prev => ({
      ...prev,
      [filter]: {
        ...prev[filter],
        sortBy: key,
        sortOrder: order,
        pagination: { ...prev[filter].pagination, currentPage: 1 }
      }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={18} />;
      case 'failed':
        return <XCircle className="text-red-500" size={18} />;
      default:
        return null;
    }
  };

  const currentState = tabStates[filter];

  const columns: Column<Transaction>[] = [
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (transaction) => (
        <div className="flex items-center gap-3">
          {['deposit', 'nft-sale'].includes(transaction.type) ? (
            <div className="p-3 bg-green-100 rounded-full">
              <ArrowDownLeft size={20} className="text-green-600" />
            </div>
          ) : (
            <div className="p-3 bg-red-100 rounded-full">
              <ArrowUpRight size={20} className="text-red-600" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 capitalize">
              {transaction.type.replace('-', ' ')}
            </p>
            {transaction.description && (
              <p className="text-sm text-gray-600">{transaction.description}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (transaction) => (
        <p className={`text-xl font-bold ${
          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {transaction.amount > 0 ? '+' : ''}{transaction.amount} {transaction.currency}
        </p>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (transaction) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(transaction.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (transaction) => (
        <p className="text-sm text-gray-500">
          {new Date(transaction.createdAt).toLocaleString()}
        </p>
      )
    }
  ];

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Transaction History</h1>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {(['all', 'deposit', 'withdrawal', 'nft-purchase', 'nft-sale'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`py-3 px-4 font-medium transition-colors relative whitespace-nowrap ${
                    filter === tab
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  {filter === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
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
            searchPlaceholder="Search transactions..."
            emptyMessage="No transactions yet"
          />
      </div>
    </div>
  );
}
