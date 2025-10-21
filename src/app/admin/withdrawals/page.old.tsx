"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, CheckCircle, XCircle, ArrowUpRight, Users, Wallet } from 'lucide-react';

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

export default function AdminWithdrawalsPage() {
  const { getToken } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const url = filter === 'all' 
        ? '/api/admin/withdrawals'
        : `/api/admin/withdrawals?status=${filter}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setAdminNote('');
    setShowModal(true);
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
        setShowModal(false);
        setSelectedWithdrawal(null);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'declined':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
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

  const filteredWithdrawals = filter === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === filter);

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    declined: withdrawals.filter(w => w.status === 'declined').length,
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Withdrawals Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Withdrawals</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <ArrowUpRight className="text-gray-400" size={32} />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 mb-1">Declined</p>
              <p className="text-3xl font-bold text-red-900">{stats.declined}</p>
            </div>
            <XCircle className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {(['all', 'pending', 'approved', 'declined'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                filter === tab
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {filter === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No withdrawals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{withdrawal.user.name}</p>
                        <p className="text-sm text-gray-500">{withdrawal.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {withdrawal.type === 'on-chain' ? (
                          <>
                            <Wallet size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-700">On-chain</span>
                          </>
                        ) : (
                          <>
                            <Users size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-700">Internal</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {withdrawal.amount} {withdrawal.network}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{withdrawal.network}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate">
                        {withdrawal.destinationType === 'email' ? (
                          <span className="text-sm text-blue-600">{withdrawal.destination}</span>
                        ) : (
                          <span className="text-sm text-gray-600 font-mono">
                            {withdrawal.destination.slice(0, 10)}...{withdrawal.destination.slice(-8)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenModal(withdrawal)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Withdrawal Details</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* User Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">User</h3>
                <p className="text-lg font-semibold text-gray-900">{selectedWithdrawal.user.name}</p>
                <p className="text-sm text-gray-600">{selectedWithdrawal.user.email}</p>
              </div>

              {/* Type */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                <div className="flex items-center gap-2">
                  {selectedWithdrawal.type === 'on-chain' ? (
                    <>
                      <Wallet size={18} className="text-gray-400" />
                      <span className="text-gray-900">On-chain Transaction</span>
                    </>
                  ) : (
                    <>
                      <Users size={18} className="text-gray-400" />
                      <span className="text-gray-900">Internal Transfer</span>
                    </>
                  )}
                </div>
              </div>

              {/* Amount & Network */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedWithdrawal.amount} {selectedWithdrawal.network}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Network</h3>
                  <p className="text-lg font-semibold text-gray-900">{selectedWithdrawal.network}</p>
                </div>
              </div>

              {/* Destination */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Destination {selectedWithdrawal.destinationType === 'email' ? '(Email)' : '(Address)'}
                </h3>
                <p className="text-gray-900 break-all font-mono text-sm bg-gray-50 p-3 rounded-lg">
                  {selectedWithdrawal.destination}
                </p>
              </div>

              {/* User Note */}
              {selectedWithdrawal.note && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">User Note</h3>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedWithdrawal.note}</p>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedWithdrawal.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedWithdrawal.status)}`}>
                    {selectedWithdrawal.status}
                  </span>
                </div>
              </div>

              {/* Date */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Requested</h3>
                <p className="text-gray-900">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</p>
              </div>

              {/* Processed Info */}
              {selectedWithdrawal.processedBy && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Processing Details</h3>
                  <p className="text-sm text-gray-700">
                    Processed by: <span className="font-semibold">{selectedWithdrawal.processedBy.name}</span>
                  </p>
                  {selectedWithdrawal.processedAt && (
                    <p className="text-sm text-gray-700">
                      Date: {new Date(selectedWithdrawal.processedAt).toLocaleString()}
                    </p>
                  )}
                  {selectedWithdrawal.adminNote && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Admin Note:</p>
                      <p className="text-sm text-gray-600">{selectedWithdrawal.adminNote}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Note Input (for pending) */}
              {selectedWithdrawal.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Note (Optional)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              {selectedWithdrawal.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleProcess('approved')}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleProcess('declined')}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    {processing ? 'Processing...' : 'Decline'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
