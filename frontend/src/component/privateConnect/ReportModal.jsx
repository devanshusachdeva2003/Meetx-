import React, { useState } from 'react';
import { X, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Button from '../ui/Button';

export function ReportModal({ isOpen, onClose, reportedUser }) {
  const [reason, setReason] = useState('Harassment or Bullying');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !reportedUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/private-connect/report', {
        reportedUserId: reportedUser._id,
        reason,
        details,
      });
      toast.success('Report submitted. We will review it promptly.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons = [
    'Harassment or Bullying',
    'Inappropriate or Explicit Content',
    'Spam or Scam',
    'Impersonation',
    'Other Safety Concern',
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5 text-red-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">Report Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm text-gray-300">
            You are reporting <span className="font-semibold text-white">{reportedUser.name}</span>.
            Please help us understand what happened.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Reason
            </label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition ${
                    reason === r
                      ? 'bg-red-500/10 border-red-500/50 text-white'
                      : 'border-border/60 hover:bg-muted text-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-red-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context or information..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="none"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-white rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-red-600/30"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
