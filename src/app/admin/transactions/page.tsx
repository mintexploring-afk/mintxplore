"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUpRight, ArrowDownLeft, Package, ShoppingBag } from 'lucide-react';
import DataTable, { Column, PaginationData } from '@/components/DataTable';

interface Transaction {
  _id: string;
  user: { name: string; email: string };
  type: 'deposit' | 'withdrawal' | 'nft-purchase' | 'nft-sale';
  amount: number;
  currency: string;
  status: string;
  description: string;
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

export default function AdminTransactionsPage() {
  const { getToken } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'nft-purchase' | 'nft-sale'>('all');

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
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, tabStates[activeFilter].searchQuery, tabStates[activeFilter].sortBy, tabStates[activeFilter].sortOrder, tabStates[activeFilter].pagination.currentPage]);

  const fetchTransactions = async () => {
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
        params.append('type', activeFilter);
      }

      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: TransactionsResponse = await response.json();
        setTabStates(prev => ({
          ...prev,
          [activeFilter]: {
            ...prev[activeFilter],
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
        [activeFilter]: { ...prev[activeFilter], loading: false }
      }));
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft size={20} className="text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight size={20} className="text-red-600" />;
      case 'nft-purchase':
        return <ShoppingBag size={20} className="text-blue-600" />;
      case 'nft-sale':
        return <Package size={20} className="text-purple-600" />;
      default:
        return null;
    }
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

  const columns: Column<Transaction>[] = [
    {
      key: 'user.name',
      label: 'User',
      sortable: true,
      render: (transaction) => (
        <div>
          <p className="font-medium text-gray-900">{transaction.user.name}</p>
          <p className="text-sm text-gray-500">{transaction.user.email}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (transaction) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(transaction.type)}
          <span className="text-sm capitalize">{transaction.type.replace('-', ' ')}</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (transaction) => (
        <div>
          <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {transaction.amount > 0 ? '+' : ''}{transaction.amount} {transaction.currency}
          </p>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (transaction) => (
        <p className="text-sm text-gray-600 max-w-xs truncate">{transaction.description}</p>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (transaction) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
          {transaction.status}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (transaction) => (
        <span className="text-sm text-gray-500">
          {new Date(transaction.createdAt).toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Transactions</h1>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {(['all', 'deposit', 'withdrawal', 'nft-purchase', 'nft-sale'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 py-3 px-4 font-medium transition-colors relative whitespace-nowrap ${
                activeFilter === tab
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' ? 'All' : tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
        searchPlaceholder="Search by user or description..."
        emptyMessage="No transactions found"
      />
    </div>
  );
}
