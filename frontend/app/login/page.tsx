"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, CheckCircle, Wallet } from 'lucide-react';
import { requestWalletChallenge, verifyWalletSignature } from '../../lib/api';
import AptosWallet from '../../lib/aptosWallet';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isWalletLogin, setIsWalletLogin] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const userData = await login(email, password);
      if (userData) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const connectWallet = async () => {
    setError('');
    setIsWalletLogin(true);
    
    try {
      const { address, publicKey, provider } = await AptosWallet.connectAptosWallet();
      
      // Check if this is a development wallet
      if ((provider as any).isDev) {
        console.log('🔧 Using development wallet simulation');
      }
      
      // Request challenge from backend
      const challengeJson = await requestWalletChallenge(address);
      const challenge = challengeJson.challenge;
      
      // Sign the challenge with the wallet
      const sig = await AptosWallet.signMessageWithWallet(provider, challenge);
      
      // Verify signature with backend (this creates user if needed and sets cookie)
      const verifyJson = await verifyWalletSignature(address, sig.signature, publicKey ?? undefined);
      
      // Store token if returned (backend also sets HttpOnly cookie)
      if (verifyJson?.access_token) {
        try { 
          localStorage.setItem('access_token', verifyJson.access_token); 
        } catch (_) {}
      }
      
      console.log('Wallet authentication successful:', verifyJson);
      
      // Refresh auth state by checking /auth/me
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Wallet login error:', error);
      
      if (error.message?.includes('No Aptos wallet provider found')) {
        setError('No Aptos wallet found. Please install Petra Wallet or Martian Wallet from your browser\'s extension store, then refresh this page.');
      } else {
        setError(`Wallet connection failed: ${error.message}`);
      }
    } finally {
      setIsWalletLogin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Workverse</h1>
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
          <form onSubmit={submit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800/50 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Wallet Login */}
          <button
            onClick={connectWallet}
            disabled={isWalletLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isWalletLogin ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting wallet...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                Connect Aptos Wallet
              </>
            )}
          </button>

          {/* Wallet Installation Guide */}
          <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <p className="text-xs text-gray-400 mb-2">Don&apos;t have an Aptos wallet?</p>
            <div className="flex flex-wrap gap-2">
              <a 
                href="https://petra.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Install Petra Wallet
              </a>
              <span className="text-gray-500">•</span>
              <a 
                href="https://martianwallet.xyz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Install Martian Wallet
              </a>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">Join thousands of professionals using Workverse</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Global talent</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
