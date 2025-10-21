"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import DataTable, { Column, PaginationData } from '@/components/DataTable';
import { Upload, Loader2, CheckCircle, XCircle, Copy, Check, Clock } from 'lucide-react';
import QRCode from 'qrcode';

interface Settings {
  depositAddress: string;
  networks: Array<{
    name: string;
    enabled: boolean;
    minDeposit: number;
    minWithdrawal: number;
    depositConfirmations: number;
    withdrawalConfirmations: number;
  }>;
  depositInstructions?: string;
}

interface Deposit {
  _id: string;
  amount: number;
  network: string;
  status: 'pending' | 'approved' | 'declined';
  note?: string;
  adminNote?: string;
  proofFiles: string[];
  createdAt: string;
}

interface DepositsResponse {
  deposits: Deposit[];
  pagination: PaginationData;
}

export default function DepositPage() {
  const router = useRouter();
  const { user, isAuthenticated, getToken } = useAuth();
  const [mainTab, setMainTab] = useState<'deposit' | 'history'>('deposit');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
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
  const [note, setNote] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    fetchSettings();
    if (mainTab === 'history') {
      fetchDeposits();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router, mainTab, searchQuery, sortBy, sortOrder, pagination.currentPage]);

  const fetchSettings = async () => {
    try {
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        
        // Generate QR code for deposit address
        if (settingsData.depositAddress) {
          const qr = await QRCode.toDataURL(settingsData.depositAddress);
          setQrCode(qr);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async () => {
    try {
      setLoadingDeposits(true);
      const token = getToken();
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchQuery,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/deposits?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: DepositsResponse = await response.json();
        setDeposits(data.deposits || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const copyAddress = () => {
    if (settings?.depositAddress) {
      navigator.clipboard.writeText(settings.depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setProofFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    setUploadingFiles(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const token = getToken();
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload files');
    } finally {
      setUploadingFiles(false);
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

  const columns: Column<Deposit>[] = [
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
      key: 'note',
      label: 'Notes',
      render: (deposit) => (
        <div className="space-y-1">
          {deposit.note && (
            <p className="text-sm bg-blue-50 p-1 rounded">{deposit.note}</p>
          )}
          {deposit.adminNote && (
            <p className="text-sm bg-yellow-50 p-1 rounded">Admin: {deposit.adminNote}</p>
          )}
        </div>
      )
    },
    {
      key: 'proofFiles',
      label: 'Proof Files',
      render: (deposit) => (
        <div className="flex gap-1">
          {deposit.proofFiles.map((file, index) => (
            <a
              key={index}
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              File {index + 1}
            </a>
          ))}
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

    if (numAmount < networkSettings.minDeposit) {
      setError(`Minimum deposit is ${networkSettings.minDeposit} ${network}`);
      return;
    }

    if (proofFiles.length === 0) {
      setError('Please upload at least one proof file');
      return;
    }

    setSubmitting(true);

    try {
      // Upload proof files first
      const uploadedUrls = await uploadFiles(proofFiles);

      // Submit deposit request
      const token = getToken();
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          network,
          proofFiles: uploadedUrls,
          note: note.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Deposit request submitted successfully! You will receive an email once it is approved.');
        setAmount('');
        setNote('');
        setProofFiles([]);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit deposit');
      }
    } catch (error) {
      console.error('Error submitting deposit:', error);
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

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Deposit</h1>

          {/* Main Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setMainTab('deposit')}
                className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                  mainTab === 'deposit'
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                New Deposit
                {mainTab === 'deposit' && (
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
                Deposit History
                {mainTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Deposit Form Tab */}
          {mainTab === 'deposit' && (
            <div className="space-y-6">
              {/* Instructions */}
              {settings?.depositInstructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Deposit Instructions</h3>
                  <p className="text-sm text-yellow-800">{settings.depositInstructions}</p>
                </div>
              )}

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Deposit Address Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Deposit Address</h2>
                  
                  <div className="flex items-center justify-center mb-6">
                    {qrCode && (
                      <Image 
                        src={qrCode} 
                        alt="Deposit Address QR Code" 
                        width={192} 
                        height={192} 
                        className="w-48 h-48 border-2 border-gray-200 rounded-lg" 
                      />
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings?.depositAddress || ''}
                        readOnly
                        className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                      />
                      <button
                        onClick={copyAddress}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network:</span>
                      <span className="font-medium">Ethereum (ERC20)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum deposit:</span>
                      <span className="font-medium">{selectedNetwork?.minDeposit || 0.00000001} {network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected arrival:</span>
                      <span className="font-medium">{selectedNetwork?.depositConfirmations || 12} network confirmations</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected unlock:</span>
                      <span className="font-medium">{selectedNetwork?.withdrawalConfirmations || 56} network confirmations</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Deposit Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Submit Deposit</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network
                    </label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    {selectedNetwork && (
                      <p className="text-xs text-red-600 mt-2">
                        Min {selectedNetwork.minDeposit} {network}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Proof (Screenshot or Transaction Hash)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-indigo-600 font-medium">Click to upload</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, PDF up to 10MB each</p>
                    </div>
                    
                    {proofFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {proofFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add any additional information..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                      {success}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || uploadingFiles}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting || uploadingFiles ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {uploadingFiles ? 'Uploading...' : 'Submitting...'}
                      </>
                    ) : (
                      'Submit Deposit'
                    )}
                  </button>
                </form>
                </div>
              </div>
            </div>
          )}

          {/* Deposit History Tab */}
          {mainTab === 'history' && (
            <DataTable
              columns={columns}
              data={deposits}
              loading={loadingDeposits}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onSort={handleSort}
              searchQuery={searchQuery}
              sortBy={sortBy}
              sortOrder={sortOrder}
              searchPlaceholder="Search by network or note..."
              emptyMessage="No deposit history yet"
            />
          )}
      </div>
    </div>
  );
}
