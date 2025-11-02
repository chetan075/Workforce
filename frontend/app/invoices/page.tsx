"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import { fetchInvoices, updateInvoiceStatus, verifyInvoiceIntegrity, getUserTrustScore } from '../../lib/api';

interface Invoice {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'RELEASED';
  clientId: string;
  freelancerId: string;
  createdAt: string;
  client?: { name: string; email: string };
  freelancer?: { name: string; email: string };
  blockchainHash?: string;
  nftTokenId?: string;
  isVerified?: boolean;
  ipfsFiles?: { filename: string; ipfsHash: string; fileSize: number }[];
}

interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  released: number;
  totalRevenue: number;
  pendingRevenue: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Show success message if coming from create page (read from window.location to avoid CSR bailout hook requirement)
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setShowCreatedMessage(params.get('created') === 'true');
    } catch (e) {
      // ignore (e.g., during tests)
      setShowCreatedMessage(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, statusFilter, searchQuery, sortBy, sortOrder]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter.toUpperCase());
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.title.toLowerCase().includes(query) ||
        invoice.client?.name.toLowerCase().includes(query) ||
        invoice.freelancer?.name.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
  };

  const calculateStats = (): InvoiceStats => {
    const stats: InvoiceStats = {
      total: invoices.length,
      draft: 0,
      sent: 0,
      paid: 0,
      released: 0,
      totalRevenue: 0,
      pendingRevenue: 0
    };

    invoices.forEach(invoice => {
      stats[invoice.status.toLowerCase() as keyof Pick<InvoiceStats, 'draft' | 'sent' | 'paid' | 'released'>]++;
      
      if (invoice.status === 'PAID' || invoice.status === 'RELEASED') {
        stats.totalRevenue += invoice.amount;
      } else if (invoice.status === 'SENT') {
        stats.pendingRevenue += invoice.amount;
      }
    });

    return stats;
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    try {
      setUpdating(invoiceId);
      await updateInvoiceStatus(invoiceId, newStatus);
      
      // Update local state
      setInvoices(prev => prev.map(invoice =>
        invoice.id === invoiceId
          ? { ...invoice, status: newStatus as any }
          : invoice
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-slate-400 bg-slate-500/10';
      case 'SENT': return 'text-blue-400 bg-blue-500/10';
      case 'PAID': return 'text-emerald-400 bg-emerald-500/10';
      case 'RELEASED': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>;
      case 'SENT':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>;
      case 'PAID':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      case 'RELEASED':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Load user trust score
  const loadTrustScore = async () => {
    if (!user?.id) return;
    try {
      const response = await getUserTrustScore(user.id);
      // Handle both object and number responses
      const score = typeof response === 'object' ? response.trustScore : response;
      setTrustScore(score);
    } catch (err) {
      console.error('Failed to load trust score:', err);
    }
  };

  // Verify invoice blockchain integrity
  const handleVerifyInvoice = async (invoiceId: string) => {
    try {
      setVerifying(invoiceId);
      const verification = await verifyInvoiceIntegrity(invoiceId);
      
      // Update local state with verification result
      setInvoices(prev => prev.map(invoice =>
        invoice.id === invoiceId
          ? { ...invoice, isVerified: verification.isValid }
          : invoice
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to verify invoice');
    } finally {
      setVerifying(null);
    }
  };

  // Load trust score on component mount
  useEffect(() => {
    loadTrustScore();
  }, [user?.id]);

  const getBlockchainStatusIcon = (invoice: Invoice) => {
    if (invoice.nftTokenId) {
      return (
        <div className="flex items-center gap-1" title="NFT Minted">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs text-purple-400">NFT</span>
        </div>
      );
    }
    if (invoice.blockchainHash) {
      return (
        <div className="flex items-center gap-1" title="Blockchain Recorded">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs text-emerald-400">Secured</span>
        </div>
      );
    }
    return null;
  };

  const getVerificationIcon = (invoice: Invoice) => {
    if (invoice.isVerified === true) {
      return (
        <div className="flex items-center gap-1" title="Verified on Blockchain">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-emerald-400">Verified</span>
        </div>
      );
    }
    if (invoice.isVerified === false) {
      return (
        <div className="flex items-center gap-1" title="Verification Failed">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-red-400">Invalid</span>
        </div>
      );
    }
    return null;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">Loading invoices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-600/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Invoice Management</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-slate-400">Create, track, and manage your invoices</p>
                {trustScore !== null && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm text-purple-400 font-medium">Trust Score: {trustScore}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link
                href="/invoices/analytics"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Link>
              <Link
                href="/invoices/templates"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Templates
              </Link>
              <Link
                href="/upload"
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Files
              </Link>
              <Link
                href="/invoices/create"
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Invoice
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showCreatedMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-emerald-400 font-medium">Invoice created successfully!</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Invoices</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-blue-400">{stats.sent}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Paid</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.paid}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-400">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending Revenue</p>
                <p className="text-2xl font-bold text-yellow-400">${stats.pendingRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="panel mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field min-w-[150px]"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="released">Released</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <label className="block text-sm font-medium text-slate-300 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 min-w-[300px]"
                  placeholder="Search invoices, clients..."
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 font-medium">Error</span>
            </div>
            <p className="text-red-300 mt-1">{error}</p>
          </div>
        )}

        <div className="panel overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No invoices found</h3>
              <p className="text-slate-400 mb-6">
                {invoices.length === 0 
                  ? "Create your first invoice to get started"
                  : "Try adjusting your filters or search query"
                }
              </p>
              {invoices.length === 0 && (
                <Link
                  href="/invoices/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Invoice
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600/20">
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Invoice</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Client/Freelancer</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Due Date</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Blockchain</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(invoice => {
                    const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                    const isOverdue = daysUntilDue < 0;
                    const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

                    return (
                      <tr key={invoice.id} className="border-b border-slate-600/10 hover:bg-slate-700/20 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="font-medium text-white hover:text-emerald-400 transition-colors"
                            >
                              {invoice.title}
                            </Link>
                            <p className="text-sm text-slate-400 mt-1">
                              Created {formatDate(invoice.createdAt)}
                            </p>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-white">
                              {user?.role === 'FREELANCER' ? invoice.client?.name : invoice.freelancer?.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              {user?.role === 'FREELANCER' ? invoice.client?.email : invoice.freelancer?.email}
                            </p>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="text-right">
                            <p className="font-medium text-white">
                              {invoice.currency || 'USD'} {invoice.amount.toLocaleString()}
                            </p>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div>
                            <p className={`text-sm ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-slate-300'}`}>
                              {formatDate(invoice.dueDate)}
                            </p>
                            <p className={`text-xs ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-slate-400'}`}>
                              {isOverdue 
                                ? `${Math.abs(daysUntilDue)} days overdue`
                                : isDueSoon 
                                  ? `${daysUntilDue} days left`
                                  : `${daysUntilDue} days left`
                              }
                            </p>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </span>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            {getBlockchainStatusIcon(invoice)}
                            {getVerificationIcon(invoice)}
                            {invoice.ipfsFiles && invoice.ipfsFiles.length > 0 && (
                              <div className="flex items-center gap-1" title={`${invoice.ipfsFiles.length} files attached`}>
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-xs text-blue-400">{invoice.ipfsFiles.length}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                              title="View Invoice"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>

                            {(invoice.status === 'PAID' || invoice.status === 'RELEASED') && invoice.blockchainHash && (
                              <button
                                onClick={() => handleVerifyInvoice(invoice.id)}
                                disabled={verifying === invoice.id}
                                className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                                title="Verify on Blockchain"
                              >
                                {verifying === invoice.id ? (
                                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                )}
                              </button>
                            )}
                            
                            {invoice.status !== 'RELEASED' && (
                              <div className="relative">
                                <select
                                  value={invoice.status}
                                  onChange={(e) => handleStatusUpdate(invoice.id, e.target.value)}
                                  disabled={updating === invoice.id}
                                  className="bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50"
                                >
                                  <option value="DRAFT">Draft</option>
                                  <option value="SENT">Sent</option>
                                  <option value="PAID">Paid</option>
                                  <option value="RELEASED">Released</option>
                                </select>
                                {updating === invoice.id && (
                                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}