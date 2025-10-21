"use client";
import React, { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle, Users } from 'lucide-react';
import DataTable, { Column, PaginationData } from '@/components/DataTable';

type TabType = 'compose' | 'subscribers';

interface Subscriber {
  _id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  subscribedDate: string;
  unsubscribedDate?: string;
}

export default function AdminNewsletter() {
  const [activeTab, setActiveTab] = useState<TabType>('compose');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({
    type: null,
    message: ''
  });

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('subscribedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const subscribersColumns: Column<Subscriber>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (row: Subscriber) => (
        <button
          onClick={() => handleToggleStatus(row.email, row.status)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {row.status === 'active' ? '✓ Active' : '✗ Inactive'}
        </button>
      )
    },
    { 
      key: 'subscribedDate', 
      label: 'Subscribed Date', 
      sortable: true,
      render: (row: Subscriber) => new Date(row.subscribedDate).toLocaleDateString()
    },
    { 
      key: 'unsubscribedDate', 
      label: 'Unsubscribed Date', 
      sortable: false,
      render: (row: Subscriber) => row.unsubscribedDate 
        ? new Date(row.unsubscribedDate).toLocaleDateString() 
        : '-'
    },
  ];

  useEffect(() => {
    if (activeTab === 'subscribers') {
      fetchSubscribers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.currentPage, searchQuery, sortBy, sortOrder]);

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchQuery,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const response = await fetch(`/api/admin/newsletter/subscribers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSubscribers(data.subscribers);
        setPagination({
          currentPage: data.page,
          totalPages: data.totalPages,
          totalItems: data.total,
          itemsPerPage: data.limit,
        });
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleToggleStatus = async (email: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch('/api/admin/newsletter/subscribers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, status: newStatus }),
      });

      if (response.ok) {
        // Refresh the subscribers list
        await fetchSubscribers();
        setStatus({
          type: 'success',
          message: `Subscription ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`
        });
        setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      } else {
        setStatus({
          type: 'error',
          message: 'Failed to update subscription status'
        });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setStatus({
        type: 'error',
        message: 'An error occurred while updating subscription status'
      });
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setStatus({
        type: 'error',
        message: 'Please fill in both subject and message fields'
      });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: `Newsletter sent successfully to ${data.sentCount} subscriber(s)!`
        });
        setSubject('');
        setMessage('');
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Failed to send newsletter'
        });
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'An error occurred while sending the newsletter'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Newsletter</h1>
        <p className="text-gray-600 mt-2">Compose and send newsletters to all subscribed users</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'compose'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Send size={18} />
              <span>Compose</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'subscribers'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>Subscribers ({pagination.totalItems})</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter newsletter subject..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message Content
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your newsletter message here..."
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Plain text format. Line breaks will be preserved in the email.
              </p>
            </div>

            {/* Status Message */}
            {status.type && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                status.type === 'success' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {status.type === 'success' ? (
                  <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm">{status.message}</p>
              </div>
            )}

            {/* Send Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSend}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Send to All Subscribers</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This newsletter will be sent to all users who have subscribed to receive emails. 
              By default, all registered users are subscribed. Users can unsubscribe using the link in the newsletter footer.
            </p>
          </div>
        </div>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div>
          <DataTable
            columns={subscribersColumns}
            data={subscribers}
            loading={loadingSubscribers}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onSort={handleSort}
            searchQuery={searchQuery}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchPlaceholder="Search by name, email, or username..."
            emptyMessage="No subscribers found"
          />
        </div>
      )}
    </div>
  );
}
