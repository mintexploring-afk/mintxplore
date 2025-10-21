'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  _id: string;
  name: string;
}

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopCategories();
  }, []);

  const fetchTopCategories = async () => {
    try {
      const res = await fetch('/api/categories?limit=10');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Successfully subscribed to newsletter!');
        setEmail('');
      } else {
        setMessage(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-blue-600 text-white py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div>
          <h4 className="font-bold text-lg mb-4">Categories</h4>
          <ul className="space-y-2">
            {categories.length > 0 ? (
              categories.map((category) => (
                <li key={category._id}>
                  <Link href={`/?category=${category._id}`} className="hover:underline">
                    {category.name}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li><a href="#" className="hover:underline">Arts</a></li>
                <li><a href="#" className="hover:underline">Gaming</a></li>
                <li><a href="#" className="hover:underline">PFPs</a></li>
              </>
            )}
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Company</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:underline">About Us</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Account</h4>
          <ul className="space-y-2">
            <li><Link href="/dashboard" className="hover:underline">Dashboard</Link></li>
            <li><Link href="/dashboard/mint" className="hover:underline">Mint NFT</Link></li>
            <li><Link href="/dashboard/transactions" className="hover:underline">Transactions</Link></li>
            <li><Link href="/dashboard/deposit" className="hover:underline">Deposit</Link></li>
            <li><Link href="/dashboard/withdraw" className="hover:underline">Withdraw</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Stay in touch</h4>
          <p className="text-sm mb-4">Don&apos;t miss anything. Stay in touch with us and get real time updates.</p>
          <form className="flex gap-2 w-full max-w-md mx-auto" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="flex-1 min-w-0 px-4 py-2 rounded-lg text-gray-900 border border-gray-200 disabled:opacity-50"
              style={{maxWidth:'100%'}}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 whitespace-nowrap disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
          {message && (
            <p className={`text-sm mt-2 ${message.includes('Successfully') ? 'text-green-200' : 'text-red-200'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-blue-500 text-sm">
        <p>© Copyright 2025 opalineart. All rights reserved.</p>
      </div>
    </footer>
  );
}
