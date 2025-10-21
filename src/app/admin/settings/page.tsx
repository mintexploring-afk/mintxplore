'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [depositAddress, setDepositAddress] = useState('');
  const [networks, setNetworks] = useState([
    {
      name: 'WETH',
      enabled: true,
      minDeposit: 0.00000001,
      minWithdrawal: 0.02,
      depositConfirmations: 12,
      withdrawalConfirmations: 56,
    },
  ]);
  const [depositInstructions, setDepositInstructions] = useState('');
  const [withdrawalInstructions, setWithdrawalInstructions] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setDepositAddress(data.depositAddress || '');
        setNetworks(data.networks || networks);
        setDepositInstructions(data.depositInstructions || '');
        setWithdrawalInstructions(data.withdrawalInstructions || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getToken();
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          depositAddress,
          networks,
          depositInstructions,
          withdrawalInstructions,
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addNetwork = () => {
    setNetworks([
      ...networks,
      {
        name: '',
        enabled: true,
        minDeposit: 0.00000001,
        minWithdrawal: 0.02,
        depositConfirmations: 12,
        withdrawalConfirmations: 56,
      },
    ]);
  };

  const removeNetwork = (index: number) => {
    setNetworks(networks.filter((_, i) => i !== index));
  };

  const updateNetwork = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...networks];
    updated[index] = { ...updated[index], [field]: value };
    setNetworks(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
        {/* Deposit Address */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Deposit Address</h2>
          <input
            type="text"
            value={depositAddress}
            onChange={(e) => setDepositAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Networks */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Networks</h2>
            <button
              type="button"
              onClick={addNetwork}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus size={16} />
              Add Network
            </button>
          </div>

          <div className="space-y-4">
            {networks.map((network, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={network.enabled}
                      onChange={(e) => updateNetwork(index, 'enabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <input
                      type="text"
                      value={network.name}
                      onChange={(e) => updateNetwork(index, 'name', e.target.value)}
                      placeholder="Network name (e.g., WETH, ETH)"
                      className="px-3 py-1 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  {networks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNetwork(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Deposit</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={network.minDeposit}
                      onChange={(e) => updateNetwork(index, 'minDeposit', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Withdrawal</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={network.minWithdrawal}
                      onChange={(e) => updateNetwork(index, 'minWithdrawal', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Deposit Confirmations</label>
                    <input
                      type="number"
                      value={network.depositConfirmations}
                      onChange={(e) => updateNetwork(index, 'depositConfirmations', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Withdrawal Confirmations</label>
                    <input
                      type="number"
                      value={network.withdrawalConfirmations}
                      onChange={(e) => updateNetwork(index, 'withdrawalConfirmations', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Instructions</label>
              <textarea
                value={depositInstructions}
                onChange={(e) => setDepositInstructions(e.target.value)}
                placeholder="Instructions shown to users when depositing..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Instructions</label>
              <textarea
                value={withdrawalInstructions}
                onChange={(e) => setWithdrawalInstructions(e.target.value)}
                placeholder="Instructions shown to users when withdrawing..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}
