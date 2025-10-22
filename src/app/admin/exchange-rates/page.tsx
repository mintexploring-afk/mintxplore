'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Save, RefreshCw } from 'lucide-react';

export default function ExchangeRatesPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [rates, setRates] = useState({
    ETH: 2500,
    WETH: 2500,
    ETH_TO_WETH: 1,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        setError('Unauthorized access');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.exchangeRates) {
        setRates(data.exchangeRates);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const token = getToken();
      if (!token) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exchangeRates: rates,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        setError('Unauthorized access');
        setSaving(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update exchange rates');
      }

      setMessage('Exchange rates updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      console.error('Error updating exchange rates:', err);
      setError(err instanceof Error ? err.message : 'Failed to update exchange rates');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRates({
      ETH: 2500,
      WETH: 2500,
      ETH_TO_WETH: 1,
    });
    setMessage('');
    setError('');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Exchange Rates</h1>
            <p className="text-gray-600 mt-2">
              Set the conversion rates from ETH/WETH to USDT for displaying prices
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Exchange Rates Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {/* ETH Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ETH to USDT Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rates.ETH}
                    onChange={(e) => setRates({ ...rates, ETH: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="2500"
                  />
                  <span className="absolute right-4 top-2.5 text-gray-500 text-sm">USDT</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  1 ETH = {rates.ETH.toLocaleString()} USDT
                </p>
              </div>

              {/* WETH Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WETH to USDT Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rates.WETH}
                    onChange={(e) => setRates({ ...rates, WETH: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="2500"
                  />
                  <span className="absolute right-4 top-2.5 text-gray-500 text-sm">USDT</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  1 WETH = {rates.WETH.toLocaleString()} USDT
                </p>
              </div>

              {/* ETH to WETH Conversion Rate */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ETH to WETH Conversion Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rates.ETH_TO_WETH}
                    onChange={(e) => setRates({ ...rates, ETH_TO_WETH: parseFloat(e.target.value) || 0 })}
                    step="0.0001"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1"
                  />
                  <span className="absolute right-4 top-2.5 text-gray-500 text-sm">WETH</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  1 ETH = {rates.ETH_TO_WETH} WETH
                </p>
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>💡 NFT Purchase:</strong> This rate allows users to buy WETH-priced NFTs using their ETH balance.
                    <br />
                    Example: If NFT costs 0.5 WETH and rate is 1, user needs {(0.5 / rates.ETH_TO_WETH).toFixed(4)} ETH to purchase.
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 How It Works</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>USDT Rates:</strong> Used to display dollar equivalent prices for all NFTs</li>
                  <li>• <strong>ETH/WETH Conversion:</strong> Allows users to pay with ETH when NFT is priced in WETH</li>
                  <li>• USDT values will be displayed below crypto prices throughout the marketplace</li>
                  <li>• Update these rates regularly to reflect current market prices</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Exchange Rates</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw size={20} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
            <p className="text-gray-600 mb-4">This is how prices will appear to users:</p>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">NFT Floor Price:</p>
                <p className="text-xl font-bold text-indigo-600">0.5 WETH</p>
                <p className="text-sm text-gray-500">≈ ${(0.5 * rates.WETH).toLocaleString()} USDT</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">NFT Floor Price:</p>
                <p className="text-xl font-bold text-indigo-600">1.2 ETH</p>
                <p className="text-sm text-gray-500">≈ ${(1.2 * rates.ETH).toLocaleString()} USDT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
