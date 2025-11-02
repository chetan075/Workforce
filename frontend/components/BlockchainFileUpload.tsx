"use client";

import React, { useState } from 'react';
import { uploadToIPFS, attachInvoiceFile } from '../lib/api';

interface BlockchainFileUploadProps {
  invoiceId: string;
  onFileAttached: (file: { filename: string; ipfsHash: string; fileSize: number }) => void;
}

export default function BlockchainFileUpload({ invoiceId, onFileAttached }: BlockchainFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // Upload to IPFS
      const uploadResult = await uploadToIPFS(file);
      
      // Attach to invoice
      const attachedFile = await attachInvoiceFile(invoiceId, {
        filename: file.name,
        ipfsHash: uploadResult.ipfsHash,
        fileSize: uploadResult.fileSize
      });
      
      onFileAttached(attachedFile);
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-purple-400 bg-purple-500/5'
            : 'border-slate-600 hover:border-slate-500'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {uploading ? (
            <div className="mt-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-purple-400 font-medium">Uploading to IPFS...</p>
              </div>
              <p className="text-sm text-slate-400 mt-1">Please wait while we store your file securely</p>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-white font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Files will be stored on IPFS and attached to the invoice
              </p>
            </div>
          )}
          
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileInputChange}
            disabled={uploading}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Files are stored securely on IPFS with cryptographic verification</span>
      </div>
    </div>
  );
}