"use client";
import React, { useState } from 'react';
import { createInvoice } from '../lib/api';

export default function CreateInvoiceModal({ open, onClose, onCreated, onSave }: { open?: boolean; onClose: ()=>void; onCreated?: ()=>void; onSave?: (invoice: any) => void }){
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>(0);
  const [clientId, setClientId] = useState('');
  const [freelancerId, setFreelancerId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    try{
      const result = await createInvoice({ title, amount: Number(amount), clientId: clientId || undefined, freelancerId: freelancerId || undefined });
      setTitle(''); setAmount(''); setClientId(''); setFreelancerId('');
      if (onSave) {
        onSave(result);
      } else if (onCreated) {
        onCreated();
      }
      onClose();
    }catch(err){
      console.error(err);
      alert('Create failed');
    }finally{ setLoading(false); }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-md p-6 rounded-xl bg-[#0f1b2a] border border-white/5 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Create Invoice</h3>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} className="bg-slate-800 border border-white/6 text-white p-2 rounded" />
          <input placeholder="Amount" value={amount === '' ? '' : String(amount)} onChange={(e)=>setAmount(e.target.value ? Number(e.target.value) : '')} className="bg-slate-800 border border-white/6 text-white p-2 rounded" />
          <input placeholder="Client ID (optional)" value={clientId} onChange={(e)=>setClientId(e.target.value)} className="bg-slate-800 border border-white/6 text-white p-2 rounded" />
          <input placeholder="Freelancer ID (optional)" value={freelancerId} onChange={(e)=>setFreelancerId(e.target.value)} className="bg-slate-800 border border-white/6 text-white p-2 rounded" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3 py-1 border border-white/6 rounded text-slate-300">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 py-1 bg-emerald-400 text-black rounded font-semibold">{loading ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
