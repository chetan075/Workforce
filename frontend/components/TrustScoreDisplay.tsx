"use client";

import React, { useState } from 'react';
import { updateTrustScore } from '../lib/api';

interface TrustScoreDisplayProps {
  userId: string;
  currentScore: number;
  onScoreUpdate?: (newScore: number) => void;
  canUpdate?: boolean;
}

export default function TrustScoreDisplay({ 
  userId, 
  currentScore, 
  onScoreUpdate, 
  canUpdate = false 
}: TrustScoreDisplayProps) {
  const [updating, setUpdating] = useState(false);
  const [newScore, setNewScore] = useState(currentScore);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-emerald-500' };
    if (score >= 80) return { label: 'Very Good', color: 'bg-emerald-600' };
    if (score >= 70) return { label: 'Good', color: 'bg-yellow-500' };
    if (score >= 60) return { label: 'Fair', color: 'bg-yellow-600' };
    if (score >= 40) return { label: 'Poor', color: 'bg-orange-500' };
    return { label: 'Very Poor', color: 'bg-red-500' };
  };

  const handleScoreUpdate = async () => {
    if (!canUpdate || newScore === currentScore) return;

    try {
      setUpdating(true);
      await updateTrustScore(userId, newScore, 'Manual update');
      onScoreUpdate?.(newScore);
    } catch (error) {
      console.error('Failed to update trust score:', error);
      setNewScore(currentScore); // Reset on error
    } finally {
      setUpdating(false);
    }
  };

  const badge = getScoreBadge(currentScore);

  return (
    <div className="bg-slate-800/50 border border-slate-600/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-white">Trust Score</h3>
        <div className={`px-2 py-1 ${badge.color} text-white text-xs font-medium rounded-full`}>
          {badge.label}
        </div>
      </div>

      <div className="space-y-3">
        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgb(71 85 105)"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${currentScore}, 100`}
                className={getScoreColor(currentScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${getScoreColor(currentScore)}`}>
                {currentScore}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-white font-medium">Blockchain Verified</span>
            </div>
            <p className="text-sm text-slate-400">
              Trust score based on transaction history, invoice completion, and user feedback
            </p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-600/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">95%</div>
            <div className="text-xs text-slate-400">On-time Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">12</div>
            <div className="text-xs text-slate-400">Completed Projects</div>
          </div>
        </div>

        {/* Update Section (if allowed) */}
        {canUpdate && (
          <div className="pt-3 border-t border-slate-600/20">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="range"
                min="0"
                max="100"
                value={newScore}
                onChange={(e) => setNewScore(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-white font-medium w-8">{newScore}</span>
            </div>
            
            <button
              onClick={handleScoreUpdate}
              disabled={updating || newScore === currentScore}
              className="w-full px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                'Update Score'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}