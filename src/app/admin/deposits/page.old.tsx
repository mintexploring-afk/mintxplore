'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Eye
} from 'lucide-react';

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

export default function AdminDepositsPage() {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');

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
  }, [user, router, filter]);

  const fetchDeposits = async () => {
    try {
      const token = getToken();
      const url = filter === 'all' ? '/api/admin/deposits' : `/api/admin/deposits?status=${filter}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeposits(data);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'declined':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Deposit Management</h1>
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'declined'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No deposits found
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{deposit.user.name}</div>
                        <div className="text-sm text-gray-500">{deposit.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{deposit.amount}</td>
                    <td className="px-6 py-4">{deposit.network}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(deposit.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                        {getStatusIcon(deposit.status)}
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedDeposit(deposit)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Detail Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Deposit Details</h2>
                <button
                  onClick={() => {
                    setSelectedDeposit(null);
                    setAdminNote('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">User</label>
                    <p className="font-medium">{selectedDeposit.user.name}</p>
                    <p className="text-sm text-gray-500">{selectedDeposit.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Amount</label>
                    <p className="font-bold text-lg">{selectedDeposit.amount} {selectedDeposit.network}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Network</label>
                    <p className="font-medium">{selectedDeposit.network}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDeposit.status)}`}>
                      {getStatusIcon(selectedDeposit.status)}
                      {selectedDeposit.status}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">Submitted</label>
                    <p className="font-medium">{new Date(selectedDeposit.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedDeposit.note && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">User Note</label>
                      <p className="font-medium">{selectedDeposit.note}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Proof Files</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDeposit.proofFiles.map((file, index) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Download size={16} />
                        <span className="text-sm">Proof {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {selectedDeposit.status === 'pending' && (
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Admin Note (Optional)</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add a note for the user..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {selectedDeposit.status !== 'pending' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Processed By</p>
                    <p className="font-medium">{selectedDeposit.processedBy?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{selectedDeposit.processedAt ? new Date(selectedDeposit.processedAt).toLocaleString() : 'N/A'}</p>
                    {selectedDeposit.adminNote && (
                      <>
                        <p className="text-sm text-gray-600 mt-2 mb-1">Admin Note</p>
                        <p className="text-sm">{selectedDeposit.adminNote}</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {selectedDeposit.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleProcess(selectedDeposit._id, 'approved')}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleProcess(selectedDeposit._id, 'declined')}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle size={20} />}
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
