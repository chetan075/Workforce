'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Clock,
  Shield,
  CreditCard,
  Plus,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Banknote
} from 'lucide-react';
import { withdrawFunds, fetchPendingPayments, fetchMe } from '@/lib/api';

interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  currency: string;
  lastUpdated: string;
}

interface PendingPayment {
  id: string;
  type: 'invoice_payment' | 'escrow_release' | 'milestone_payment';
  amount: number;
  currency: string;
  description: string;
  estimatedReleaseDate: string;
  clientName: string;
  projectTitle: string;
  invoiceId?: string;
  status: 'processing' | 'pending_approval' | 'scheduled';
}

interface RecentTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment_received' | 'fee_deducted';
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function WalletPage() {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = await fetchMe();
      setCurrentUser(user);
      
      // Mock wallet data (replace with actual API calls)
      const mockWalletBalance: WalletBalance = {
        availableBalance: 3456.78,
        pendingBalance: 1234.56,
        totalEarnings: 15789.45,
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      };

      const mockPendingPayments: PendingPayment[] = [
        {
          id: '1',
          type: 'escrow_release',
          amount: 850.00,
          currency: 'USD',
          description: 'Website Development Project - Final Payment',
          estimatedReleaseDate: '2025-11-05T00:00:00Z',
          clientName: 'TechCorp Solutions',
          projectTitle: 'E-commerce Website Development',
          invoiceId: 'inv_001',
          status: 'pending_approval'
        },
        {
          id: '2',
          type: 'milestone_payment',
          amount: 384.56,
          currency: 'USD',
          description: 'Mobile App Development - Milestone 2',
          estimatedReleaseDate: '2025-11-03T00:00:00Z',
          clientName: 'StartupXYZ',
          projectTitle: 'iOS Mobile Application',
          status: 'processing'
        }
      ];

      const mockRecentTransactions: RecentTransaction[] = [
        {
          id: '1',
          type: 'payment_received',
          amount: 1200.00,
          currency: 'USD',
          description: 'API Integration Project Payment',
          date: '2025-10-31T14:30:00Z',
          status: 'completed'
        },
        {
          id: '2',
          type: 'withdrawal',
          amount: 800.00,
          currency: 'USD',
          description: 'Bank Transfer Withdrawal',
          date: '2025-10-30T09:15:00Z',
          status: 'completed'
        },
        {
          id: '3',
          type: 'fee_deducted',
          amount: 36.00,
          currency: 'USD',
          description: 'Platform Service Fee',
          date: '2025-10-30T09:10:00Z',
          status: 'completed'
        },
        {
          id: '4',
          type: 'payment_received',
          amount: 650.00,
          currency: 'USD',
          description: 'Logo Design Project Payment',
          date: '2025-10-29T11:45:00Z',
          status: 'completed'
        }
      ];

      setWalletBalance(mockWalletBalance);
      setPendingPayments(mockPendingPayments);
      setRecentTransactions(mockRecentTransactions);
      
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshLoading(true);
      await loadWalletData();
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    const amount = parseFloat(withdrawAmount);
    
    if (amount > (walletBalance?.availableBalance || 0)) {
      alert('Insufficient balance for withdrawal.');
      return;
    }

    try {
      setWithdrawLoading(true);
      
      // Call withdrawal API
      await withdrawFunds({
        amount,
        currency: walletBalance?.currency || 'USD',
        method: 'bank_transfer' // This would be selected by user
      });
      
      // Refresh wallet data
      await loadWalletData();
      
      // Close modal and reset form
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      
      alert('Withdrawal request submitted successfully!');
      
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Failed to process withdrawal. Please try again.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment_received':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
      case 'fee_deducted':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'pending_approval':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
              <p className="mt-2 text-gray-600">Manage your earnings and withdrawals</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!walletBalance || walletBalance.availableBalance <= 0}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Available Balance */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Available Balance</h3>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-blue-100 hover:text-white"
              >
                {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {showBalance 
                    ? formatCurrency(walletBalance?.availableBalance || 0, walletBalance?.currency)
                    : '••••••'
                  }
                </p>
                <p className="text-blue-100 text-sm mt-1">
                  Ready for withdrawal
                </p>
              </div>
              <div className="p-3 bg-blue-500 bg-opacity-30 rounded-lg">
                <Wallet className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Pending Balance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Balance</h3>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {showBalance 
                    ? formatCurrency(walletBalance?.pendingBalance || 0, walletBalance?.currency)
                    : '••••••'
                  }
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  In escrow & processing
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {showBalance 
                    ? formatCurrency(walletBalance?.totalEarnings || 0, walletBalance?.currency)
                    : '••••••'
                  }
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  All-time earnings
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Withdraw Funds
            </button>
            <button
              onClick={() => router.push('/payments/history')}
              className="flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Payment History
            </button>
            <button
              onClick={() => router.push('/payments/methods')}
              className="flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Methods
            </button>
            <button
              onClick={() => router.push('/payments/escrow')}
              className="flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Shield className="h-5 w-5 mr-2" />
              Escrow Management
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Payments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Pending Payments</h2>
              <span className="text-sm text-gray-500">{pendingPayments.length} pending</span>
            </div>

            <div className="space-y-4">
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending payments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your pending payments will appear here.
                  </p>
                </div>
              ) : (
                pendingPayments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {payment.description}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(payment.status)}`}>
                            {payment.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {payment.projectTitle} • {payment.clientName}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            Expected: {formatDate(payment.estimatedReleaseDate)}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {payment.invoiceId && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => router.push(`/invoices/${payment.invoiceId}`)}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          View Invoice <ArrowRight className="h-3 w-3 ml-1" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <button
                onClick={() => router.push('/payments/history')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>

            <div className="space-y-4">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.type === 'payment_received' || transaction.type === 'deposit'
                        ? 'text-green-600'
                        : 'text-gray-900'
                    }`}>
                      {transaction.type === 'payment_received' || transaction.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <div className="flex items-center mt-1">
                      {transaction.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {transaction.status === 'pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                      {transaction.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500" />}
                      <span className="text-xs text-gray-500 ml-1 capitalize">
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Withdrawal Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Withdraw Funds</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(walletBalance?.availableBalance || 0, walletBalance?.currency)}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    max={walletBalance?.availableBalance || 0}
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum withdrawal: $10.00
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Banknote className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Withdrawal to your default bank account
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Funds typically arrive within 1-3 business days
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {withdrawLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Withdraw'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}