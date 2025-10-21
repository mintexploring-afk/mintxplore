'use client';

import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftPrice: number;
  userBalances: {
    WETH: number;
    ETH: number;
  };
  ethToWethRate: number;
  onConfirm: (paymentCurrency: 'ETH' | 'WETH') => void;
  loading?: boolean;
  success?: boolean;
  selectedCurrency?: 'ETH' | 'WETH' | null;
}

export default function PaymentModal({
  isOpen,
  onClose,
  nftPrice,
  userBalances,
  ethToWethRate,
  onConfirm,
  loading = false,
  success = false,
  selectedCurrency = null
}: PaymentModalProps) {
  const [localSelectedCurrency, setLocalSelectedCurrency] = useState<'ETH' | 'WETH' | null>(null);
  
  if (!isOpen) return null;

  const requiredETH = nftPrice / ethToWethRate;
  const hasEnoughWETH = userBalances.WETH >= nftPrice;
  const hasEnoughETH = userBalances.ETH >= requiredETH;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-md w-full my-8">
        {/* Scrollable content wrapper */}
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Success State */}
            {success && (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</h2>
                <p className="text-gray-600 mb-4">
                  You paid with {selectedCurrency} and now own this NFT
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800">
                    <strong>Transaction Complete</strong><br />
                    Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && !success && (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 size={40} className="text-indigo-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
                <p className="text-gray-600 mb-4">
                  Please wait while we process your {selectedCurrency} payment
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Do not close this window
                  </p>
                </div>
              </div>
            )}

            {/* Normal State - Payment Selection */}
            {!loading && !success && (
              <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Payment Method</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <X size={24} />
              </button>
            </div>

        {/* NFT Price */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">NFT Price:</p>
          <p className="text-2xl font-bold text-gray-900">{nftPrice} WETH</p>
        </div>

        {/* Payment Options */}
        <div className="space-y-4 mb-6">
          {/* WETH Option */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              localSelectedCurrency === 'WETH'
                ? 'border-indigo-600 bg-indigo-100'
                : hasEnoughWETH
                ? 'border-gray-300 bg-white hover:bg-gray-50'
                : 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed'
            }`}
            onClick={() => hasEnoughWETH && !loading && setLocalSelectedCurrency('WETH')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={localSelectedCurrency === 'WETH'}
                  readOnly
                  disabled={!hasEnoughWETH || loading}
                  className="w-4 h-4"
                />
                <span className="font-semibold text-gray-900">Pay with WETH</span>
              </div>
              {hasEnoughWETH ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✓ Available
                </span>
              ) : (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Insufficient
                </span>
              )}
            </div>
            <div className="ml-6 text-sm">
              <p className="text-gray-600">
                Required: <span className="font-semibold">{nftPrice} WETH</span>
              </p>
              <p className={hasEnoughWETH ? 'text-green-600' : 'text-red-600'}>
                Your balance: <span className="font-semibold">{userBalances.WETH} WETH</span>
              </p>
              {!hasEnoughWETH && (
                <p className="text-red-600 mt-1 text-xs">
                  You need {(nftPrice - userBalances.WETH).toFixed(4)} more WETH
                </p>
              )}
            </div>
          </div>

          {/* ETH Option */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              localSelectedCurrency === 'ETH'
                ? 'border-indigo-600 bg-indigo-100'
                : hasEnoughETH
                ? 'border-gray-300 bg-white hover:bg-gray-50'
                : 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed'
            }`}
            onClick={() => hasEnoughETH && !loading && setLocalSelectedCurrency('ETH')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={localSelectedCurrency === 'ETH'}
                  readOnly
                  disabled={!hasEnoughETH || loading}
                  className="w-4 h-4"
                />
                <span className="font-semibold text-gray-900">Pay with ETH</span>
              </div>
              {hasEnoughETH ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✓ Available
                </span>
              ) : (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Insufficient
                </span>
              )}
            </div>
            <div className="ml-6 text-sm">
              <p className="text-gray-600">
                Required: <span className="font-semibold">{requiredETH.toFixed(4)} ETH</span>
              </p>
              <p className={hasEnoughETH ? 'text-green-600' : 'text-red-600'}>
                Your balance: <span className="font-semibold">{userBalances.ETH} ETH</span>
              </p>
              <p className="text-indigo-600 mt-1 text-xs">
                Conversion rate: 1 ETH = {ethToWethRate} WETH
              </p>
              {!hasEnoughETH && (
                <p className="text-red-600 mt-1 text-xs">
                  You need {(requiredETH - userBalances.ETH).toFixed(4)} more ETH
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {!hasEnoughWETH && !hasEnoughETH && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Insufficient Balance:</strong> You don&apos;t have enough ETH or WETH to purchase this NFT.
              Please deposit funds to continue.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 How It Works</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• NFTs are priced in WETH, but you can pay with ETH</li>
            <li>• ETH will be automatically converted to WETH at the current rate</li>
            <li>• The seller always receives WETH</li>
            <li>• Choose the currency you have available</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Proceed Button */}
          <button
            onClick={() => localSelectedCurrency && onConfirm(localSelectedCurrency)}
            disabled={!localSelectedCurrency || loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {localSelectedCurrency ? `Proceed with ${localSelectedCurrency}` : 'Select Payment Method'}
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
