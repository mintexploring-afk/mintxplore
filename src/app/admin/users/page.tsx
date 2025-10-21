"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, ShieldCheck } from 'lucide-react';
import DataTable, { Column, PaginationData } from '@/components/DataTable';

interface UserData {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  balances: {
    WETH: number;
    ETH: number;
  };
  isEmailVerified: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: UserData[];
  pagination: PaginationData;
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchUsers();
    fetchAllUsersForStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortBy, sortOrder, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchQuery,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsersForStats = async () => {
    try {
      const token = getToken();
      const response = await fetch(`/api/admin/users?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: UsersResponse = await response.json();
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
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

  const totalUsers = allUsers.length;
  const adminUsers = allUsers.filter(u => u.role === 'admin').length;
  const regularUsers = allUsers.filter(u => u.role === 'user').length;
  const totalWETH = allUsers.reduce((sum, u) => sum + (u.balances?.WETH || 0), 0);
  const totalETH = allUsers.reduce((sum, u) => sum + (u.balances?.ETH || 0), 0);

  const columns: Column<UserData>[] = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.username && (
              <p className="text-xs text-gray-400">@{user.username}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user) => (
        user.role === 'admin' ? (
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-indigo-600" />
            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
              Admin
            </span>
          </div>
        ) : (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            User
          </span>
        )
      )
    },
    {
      key: 'balances.WETH',
      label: 'WETH Balance',
      sortable: true,
      render: (user) => (
        <span className="font-semibold text-indigo-600">
          {user.balances?.WETH?.toFixed(8) || '0.00000000'}
        </span>
      )
    },
    {
      key: 'balances.ETH',
      label: 'ETH Balance',
      sortable: true,
      render: (user) => (
        <span className="font-semibold text-blue-600">
          {user.balances?.ETH?.toFixed(8) || '0.00000000'}
        </span>
      )
    },
    {
      key: 'isEmailVerified',
      label: 'Verified',
      sortable: true,
      render: (user) => (
        user.isEmailVerified ? (
          <div className="flex items-center gap-1 text-green-600">
            <Mail size={16} />
            <span className="text-sm">Verified</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Not verified</span>
        )
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (user) => (
        <span className="text-sm text-gray-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Users Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
            </div>
            <User className="text-gray-400" size={32} />
          </div>
        </div>

        <div className="bg-indigo-50 rounded-xl p-6 shadow-sm border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-700 mb-1">Admins</p>
              <p className="text-3xl font-bold text-indigo-900">{adminUsers}</p>
            </div>
            <ShieldCheck className="text-indigo-500" size={32} />
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Regular Users</p>
              <p className="text-3xl font-bold text-blue-900">{regularUsers}</p>
            </div>
            <User className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-indigo-200">
          <div>
            <p className="text-sm text-indigo-700 mb-2">Total Balances</p>
            <p className="text-lg font-bold text-indigo-900">{totalWETH.toFixed(2)} WETH</p>
            <p className="text-lg font-bold text-blue-900">{totalETH.toFixed(2)} ETH</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchPlaceholder="Search by name, email, or username..."
        emptyMessage="No users found"
      />
    </div>
  );
}
