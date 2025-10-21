"use client";
import React, { useState } from 'react';
import { X, Eye, EyeOff, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Use AuthContext login to store user data and token in cookies
        login(data.user, data.token);
        
        // Redirect based on user role
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
        
        // Check if it's an email verification error
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setShowResendVerification(true);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setResendingVerification(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setError('');
        setShowResendVerification(false);
        alert(data.message || 'Verification email sent! Please check your inbox.');
      } else {
        alert(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      console.error('Resend error:', err);
      alert('Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotMsg('');
    setForgotLoading(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setForgotMsg('Reset link sent! Check your email.');
    } else {
      setForgotMsg(data.error || 'Failed to send reset link');
    }
    setForgotLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Sign In Form */}
      <div className="w-1/2 bg-gray-50 flex items-center justify-center relative">
        <button className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <div className="w-full max-w-md px-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-12">Sign In</h1>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                  autoComplete="email"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {/* Forgot Password */}
            <div className="text-left">
              <button
                type="button"
                className="text-blue-600 text-sm hover:underline"
                onClick={() => setShowForgot(true)}
              >
                Forgot Password
              </button>
            </div>
            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                {error}
                {showResendVerification && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="block mt-2 text-blue-600 hover:underline font-medium disabled:text-blue-400 disabled:cursor-not-allowed"
                  >
                    {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                )}
              </div>
            )}
            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Sign Up
              </a>
            </p>
          </form>
          {/* Forgot Password Modal */}
          {showForgot && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm relative">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={() => { setShowForgot(false); setForgotMsg(''); }}>
                  <X size={20} />
                </button>
                <h2 className="text-xl font-bold mb-4 text-blue-600">Forgot Password</h2>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  {forgotMsg && <div className={`text-sm ${forgotMsg.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>{forgotMsg}</div>}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Right Side - Welcome Message */}
      <div className="w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white p-12">
        <div className="text-center max-w-md">
          <h2 className="text-5xl font-bold mb-6">Hello, Friend!</h2>
          <p className="text-xl text-blue-100 mb-12">
            Enter your personal details and take a journey with us
          </p>
          <button
            className="border-2 border-white text-white px-12 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
            onClick={() => router.push('/register')}
          >
            SIGN UP
          </button>
        </div>
      </div>
      {/* Chat Button */}
      <button className="fixed bottom-6 right-6 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 z-50">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12h8M8 8h8M8 16h5M12 22a10 10 0 110-20 10 10 0 010 20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
