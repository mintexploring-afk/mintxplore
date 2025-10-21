'use client';

import { useEffect, useState } from 'react';

interface PriceDisplayProps {
  amount: number;
  currency: 'ETH' | 'WETH';
  className?: string;
  showUSDT?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PriceDisplay({ 
  amount, 
  currency, 
  className = '', 
  showUSDT = true,
  size = 'md'
}: PriceDisplayProps) {
  const [exchangeRates, setExchangeRates] = useState({ ETH: 2500, WETH: 2500 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates');
      const data = await response.json();
      if (data.exchangeRates) {
        setExchangeRates(data.exchangeRates);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const usdtValue = amount * exchangeRates[currency];

  const sizeClasses = {
    sm: {
      crypto: 'text-sm font-semibold',
      usdt: 'text-xs',
    },
    md: {
      crypto: 'text-lg font-bold',
      usdt: 'text-sm',
    },
    lg: {
      crypto: 'text-2xl font-bold',
      usdt: 'text-base',
    },
  };

  return (
    <div className={className}>
      <p className={`${sizeClasses[size].crypto} text-indigo-600`}>
        {amount} {currency}
      </p>
      {showUSDT && !loading && (
        <p className={`${sizeClasses[size].usdt} text-gray-500`}>
          ≈ ${usdtValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
        </p>
      )}
    </div>
  );
}
