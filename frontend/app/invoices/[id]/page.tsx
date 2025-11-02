"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';
import { fetchInvoice, updateInvoiceStatus, mintInvoiceNFTSimple, getUserTrustScore } from '../../../lib/api';
import BlockchainStatus from '../../../components/BlockchainStatus';
import BlockchainFileUpload from '../../../components/BlockchainFileUpload';
import TrustScoreDisplay from '../../../components/TrustScoreDisplay';

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
  project?: { title: string; description: string };
  storedFiles?: { filename: string; id: string }[];
  blockchainHash?: string;
  nftTokenId?: string;
  isVerified?: boolean;
  ipfsFiles?: { filename: string; ipfsHash: string; fileSize: number }[];
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [trustScore, setTrustScore] = useState<number | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoice(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!invoice) return;
    
    try {
      setUpdating(true);
      await updateInvoiceStatus(invoice.id, newStatus);
      setInvoice(prev => prev ? { ...prev, status: newStatus as any } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'SENT': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'PAID': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'RELEASED': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>;
      case 'SENT':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>;
      case 'PAID':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      case 'RELEASED':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const printInvoice = () => {
    window.print();
  };

  // Load trust score for the other party
  const loadTrustScore = async () => {
    if (!invoice) return;
    const otherUserId = user?.role === 'FREELANCER' ? invoice.clientId : invoice.freelancerId;
    try {
      const response = await getUserTrustScore(otherUserId);
      // Handle both object response and direct score response
      const score = typeof response === 'object' ? response.trustScore : response;
      setTrustScore(score);
    } catch (err) {
      console.error('Failed to load trust score:', err);
    }
  };

  // Mint NFT for paid invoice
  const handleMintNFT = async () => {
    if (!invoice || invoice.status !== 'PAID') return;
    
    try {
      setMinting(true);
      const result = await mintInvoiceNFTSimple(invoice.id);
      
      // Update invoice with NFT data
      setInvoice(prev => prev ? {
        ...prev,
        nftTokenId: result.tokenId,
        blockchainHash: result.transactionHash
      } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setMinting(false);
    }
  };

  // Handle file attachment callback
  const handleFileAttached = (file: { filename: string; ipfsHash: string; fileSize: number }) => {
    setInvoice(prev => prev ? {
      ...prev,
      ipfsFiles: [...(prev.ipfsFiles || []), file]
    } : null);
  };

  // Load trust score when invoice loads
  useEffect(() => {
    if (invoice) {
      loadTrustScore();
    }
  }, [invoice?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'The requested invoice could not be found.'}</p>
          <Link href="/invoices" className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const daysUntilDue = getDaysUntilDue(invoice.dueDate);
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-600/20 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/invoices"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Invoices
              </Link>
              <div className="h-6 w-px bg-slate-600"></div>
              <h1 className="text-2xl font-bold text-white">Invoice Details</h1>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={printInvoice}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              
              <Link
                href={`/upload?invoice=${invoice.id}`}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Files
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Invoice Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <div className="panel">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{invoice.title}</h1>
                  <p className="text-slate-400">Invoice #{invoice.id.slice(0, 8).toUpperCase()}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">
                    {invoice.currency || 'USD'} {invoice.amount.toLocaleString()}
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    <span className="font-medium">{invoice.status}</span>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Bill From</h3>
                  <div className="space-y-1">
                    <p className="text-white font-medium">{invoice.freelancer?.name}</p>
                    <p className="text-slate-400">{invoice.freelancer?.email}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Bill To</h3>
                  <div className="space-y-1">
                    <p className="text-white font-medium">{invoice.client?.name}</p>
                    <p className="text-slate-400">{invoice.client?.email}</p>
                  </div>
                </div>
              </div>

              {/* Project Link */}
              {invoice.project && (
                <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Related Project</h4>
                  <p className="text-emerald-400 font-medium">{invoice.project.title}</p>
                  <p className="text-slate-400 text-sm mt-1">{invoice.project.description}</p>
                </div>
              )}
            </div>

            {/* Invoice Timeline */}
            <div className="panel">
              <h3 className="text-lg font-semibold text-white mb-4">Invoice Timeline</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Invoice Created</p>
                    <p className="text-slate-400 text-sm">{formatDate(invoice.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['SENT', 'PAID', 'RELEASED'].includes(invoice.status) 
                      ? 'bg-emerald-500' 
                      : 'bg-slate-600'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Invoice Sent</p>
                    <p className="text-slate-400 text-sm">
                      {['SENT', 'PAID', 'RELEASED'].includes(invoice.status) 
                        ? 'Sent to client' 
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['PAID', 'RELEASED'].includes(invoice.status) 
                      ? 'bg-emerald-500' 
                      : 'bg-slate-600'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Payment Received</p>
                    <p className="text-slate-400 text-sm">
                      {['PAID', 'RELEASED'].includes(invoice.status) 
                        ? 'Payment confirmed' 
                        : 'Waiting for payment'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    invoice.status === 'RELEASED' 
                      ? 'bg-emerald-500' 
                      : 'bg-slate-600'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Funds Released</p>
                    <p className="text-slate-400 text-sm">
                      {invoice.status === 'RELEASED' 
                        ? 'Funds released to freelancer' 
                        : 'Pending release'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Files */}
            {invoice.storedFiles && invoice.storedFiles.length > 0 && (
              <div className="panel">
                <h3 className="text-lg font-semibold text-white mb-4">Attached Files</h3>
                
                <div className="space-y-2">
                  {invoice.storedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-white">{file.filename}</span>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Status */}
            <div className="panel">
              <h3 className="text-lg font-semibold text-white mb-4">Invoice Status</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)} border`}>
                    {invoice.status}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Due Date</span>
                  <span className={`text-sm ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-white'}`}>
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Days Until Due</span>
                  <span className={`text-sm font-medium ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {isOverdue 
                      ? `${Math.abs(daysUntilDue)} days overdue`
                      : `${daysUntilDue} days left`
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-emerald-400 font-semibold">
                    {invoice.currency || 'USD'} {invoice.amount.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {invoice.status !== 'RELEASED' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Update Status
                  </label>
                  <select
                    value={invoice.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                    className="w-full input-field disabled:opacity-50"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="RELEASED">Released</option>
                  </select>
                  {updating && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-slate-400">Updating status...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="panel">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={printInvoice}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Invoice
                </button>
                
                <Link
                  href={`/upload?invoice=${invoice.id}`}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Files
                </Link>
                
                <button
                  className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Open Dispute
                </button>
              </div>
            </div>

            {/* Payment Information */}
            <div className="panel">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Total</span>
                  <span className="text-white font-medium">
                    {invoice.currency || 'USD'} {invoice.amount.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid Amount</span>
                  <span className="text-emerald-400 font-medium">
                    {['PAID', 'RELEASED'].includes(invoice.status) 
                      ? `${invoice.currency || 'USD'} ${invoice.amount.toLocaleString()}`
                      : `${invoice.currency || 'USD'} 0`
                    }
                  </span>
                </div>
                
                <div className="border-t border-slate-600/20 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outstanding Balance</span>
                    <span className={`font-semibold ${
                      ['PAID', 'RELEASED'].includes(invoice.status) 
                        ? 'text-emerald-400' 
                        : 'text-yellow-400'
                    }`}>
                      {['PAID', 'RELEASED'].includes(invoice.status) 
                        ? `${invoice.currency || 'USD'} 0`
                        : `${invoice.currency || 'USD'} ${invoice.amount.toLocaleString()}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Status */}
            <BlockchainStatus
              invoiceId={invoice.id}
              blockchainHash={invoice.blockchainHash}
              nftTokenId={invoice.nftTokenId}
              isVerified={invoice.isVerified}
              status={invoice.status}
            />

            {/* NFT Minting */}
            {invoice.status === 'PAID' && !invoice.nftTokenId && (
              <div className="panel">
                <h3 className="text-lg font-semibold text-white mb-4">Create NFT</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Mint this invoice as an NFT on the blockchain for permanent record keeping and enhanced security.
                </p>
                <button
                  onClick={handleMintNFT}
                  disabled={minting}
                  className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-3"
                >
                  {minting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Minting NFT...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Mint as NFT
                    </>
                  )}
                </button>
              </div>
            )}

            {/* File Upload */}
            {['PAID', 'RELEASED'].includes(invoice.status) && (
              <div className="panel">
                <h3 className="text-lg font-semibold text-white mb-4">Attach Files</h3>
                <BlockchainFileUpload
                  invoiceId={invoice.id}
                  onFileAttached={handleFileAttached}
                />
              </div>
            )}

            {/* Trust Score */}
            {trustScore !== null && (
              <TrustScoreDisplay
                userId={user?.role === 'FREELANCER' ? invoice.clientId : invoice.freelancerId}
                currentScore={trustScore}
                canUpdate={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}