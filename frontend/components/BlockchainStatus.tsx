"use client";

import React, { useState, useEffect } from 'react';
import { verifyInvoiceIntegrity, getBlockchainTransactionStatus } from '../lib/api';

interface BlockchainStatusProps {
  invoiceId: string;
  blockchainHash?: string;
  nftTokenId?: string | number;
  isVerified?: boolean;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'RELEASED';
}

export default function BlockchainStatus({ 
  invoiceId, 
  blockchainHash, 
  nftTokenId, 
  isVerified, 
  status 
}: BlockchainStatusProps) {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(isVerified || null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkTransactionStatus = async () => {
      if (!blockchainHash) return;
      
      try {
        const status = await getBlockchainTransactionStatus(blockchainHash);
        setTransactionStatus(status);
      } catch (error) {
        console.error('Failed to check transaction status:', error);
      }
    };

    if (blockchainHash && status === 'PAID') {
      checkTransactionStatus();
    }
  }, [blockchainHash, status]);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const verification = await verifyInvoiceIntegrity(invoiceId);
      setVerificationResult(verification.isValid);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult(false);
    } finally {
      setVerifying(false);
    }
  };

  const getStatusDisplay = () => {
    if (status === 'DRAFT' || status === 'SENT') {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Pending payment</span>
        </div>
      );
    }

    if (nftTokenId) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium text-purple-400">NFT Minted</span>
          </div>
          <div className="text-xs text-slate-400">
            Token ID: {String(nftTokenId).slice(0, 10)}...
          </div>
        </div>
      );
    }

    if (blockchainHash) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium text-emerald-400">Blockchain Secured</span>
          </div>
          
          <div className="text-xs text-slate-400">
            Hash: {blockchainHash.slice(0, 10)}...
          </div>
          
          {transactionStatus && (
            <div className="text-xs text-slate-400">
              Status: <span className="text-emerald-400">{transactionStatus}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Not secured</span>
      </div>
    );
  };

  const getVerificationDisplay = () => {
    if (verificationResult === true) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-emerald-400 font-medium">Verified</span>
        </div>
      );
    }

    if (verificationResult === false) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-400 font-medium">Verification Failed</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-slate-800/50 border border-slate-600/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Blockchain Status</h3>
        
        {blockchainHash && (
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {verifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verify
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {getStatusDisplay()}
        {getVerificationDisplay()}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-600/20">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Powered by Aptos blockchain for immutable record keeping</span>
      </div>
    </div>
  );
}