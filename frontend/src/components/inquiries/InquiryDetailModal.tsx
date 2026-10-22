import React, { useState, useEffect } from 'react';
import { Inquiry, InquiryActivity, InquiryStatus, User } from '../../types';
import { apiRequest, ApiError } from '../../api/client';
import { StatusBadge } from '../common/StatusBadge';
import { ErrorAlert } from '../common/ErrorAlert';
import {
  X,
  UserCheck,
  Calendar,
  Lock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  History,
  AlertTriangle,
  RefreshCw,
  Mail,
  User as UserIcon,
} from 'lucide-react';

interface InquiryDetailModalProps {
  inquiryId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const InquiryDetailModal: React.FC<InquiryDetailModalProps> = ({
  inquiryId,
  onClose,
  onUpdated,
}) => {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [activities, setActivities] = useState<InquiryActivity[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [note, setNote] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  // UI state for errors and stale conflicts
  const [error, setError] = useState<string | null>(null);
  const [isStaleConflict, setIsStaleConflict] = useState(false);
  const [showReopenPrompt, setShowReopenPrompt] = useState(false);

  const fetchDetails = async () => {
    setIsLoading(true);
    setError(null);
    setIsStaleConflict(false);

    try {
      const res = await apiRequest<{
        success: boolean;
        data: { inquiry: Inquiry; activities: InquiryActivity[] };
      }>(`/inquiries/${inquiryId}`);

      if (res.success && res.data) {
        setInquiry(res.data.inquiry);
        setActivities(res.data.activities || []);
        setSelectedAssignee(res.data.inquiry.assigned_to_id || '');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Access Denied: You do not have permission to view this restricted inquiry.');
      } else if (err instanceof ApiError && err.status === 404) {
        setError('Inquiry not found or may have been deleted.');
      } else {
        setError(err.message || 'Failed to load inquiry details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Fetch staff for assignment dropdown
    apiRequest<{ success: boolean; data: User[] }>('/auth/staff')
      .then((res) => {
        if (res.success && res.data) {
          setStaffList(res.data);
        }
      })
      .catch(() => {});
  }, [inquiryId]);

  const handleStatusChange = async (
    targetStatus: InquiryStatus,
    overrideNote?: string
  ) => {
    if (!inquiry) return;
    setIsUpdating(true);
    setError(null);
    setIsStaleConflict(false);

    try {
      const res = await apiRequest<{ success: boolean; data: Inquiry }>(
        `/inquiries/${inquiry.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: targetStatus,
            version: inquiry.version, // Send current version for optimistic locking
            note: overrideNote !== undefined ? overrideNote : note,
            assigned_to_id: selectedAssignee ? selectedAssignee : null,
          }),
        }
      );

      if (res.success) {
        setNote('');
        setShowReopenPrompt(false);
        await fetchDetails();
        onUpdated();
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        // Stale data detected!
        setIsStaleConflict(true);
        setError(
          'Stale Data Detected: Another user or tab has modified this inquiry since you opened it. Your changes were blocked to prevent overwriting.'
        );
      } else {
        setError(err.message || 'Failed to update status.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!inquiry) return;
    setSelectedAssignee(newAssigneeId);
    setIsUpdating(true);
    setError(null);

    try {
      await apiRequest(`/inquiries/${inquiry.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: inquiry.status,
          version: inquiry.version,
          assigned_to_id: newAssigneeId ? newAssigneeId : null,
          note: newAssigneeId
            ? `Reassigned inquiry to staff member`
            : `Unassigned inquiry`,
        }),
      });

      await fetchDetails();
      onUpdated();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setIsStaleConflict(true);
        setError('Stale Data: Inquiry was modified by someone else. Please reload.');
      } else {
        setError(err.message || 'Failed to update assignment.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="inquiry-detail-modal"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-gray-400">
                INQ-{inquiryId.slice(0, 8).toUpperCase()}
              </span>
              {inquiry && <StatusBadge status={inquiry.status} size="sm" />}
              {inquiry?.is_restricted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                  <Lock size={11} /> Confidential
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {inquiry?.subject || 'Loading Inquiry Details...'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Stale Data Conflict Alert */}
          {isStaleConflict && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 flex items-start justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-950">
                    Concurrency Conflict Detected
                  </p>
                  <p>
                    This inquiry has been changed in another window or by another team
                    member. To protect data integrity, your update was not written over
                    their changes.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchDetails}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shrink-0 transition-colors shadow-sm"
              >
                <RefreshCw size={12} />
                Reload Latest
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && !isStaleConflict && (
            <ErrorAlert
              message={error}
              onRetry={fetchDetails}
              onDismiss={() => setError(null)}
            />
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-gray-400">
              <div className="w-8 h-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Loading inquiry history...</p>
            </div>
          ) : inquiry ? (
            <>
              {/* Customer & Assignment Meta Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Customer Info
                  </span>
                  <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                    <UserIcon size={13} className="text-amber-800" />
                    {inquiry.customer_name}
                  </div>
                  <div className="text-gray-600 flex items-center gap-1.5 font-mono text-[11px]">
                    <Mail size={12} className="text-gray-400" />
                    {inquiry.customer_contact}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Staff Assignee
                  </span>
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-amber-800 shrink-0" />
                    <select
                      value={selectedAssignee}
                      onChange={(e) => handleAssigneeChange(e.target.value)}
                      disabled={isUpdating}
                      className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-800 w-full"
                    >
                      <option value="">Unassigned (Triage)</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Calendar size={11} />
                    <span>Logged {formatDate(inquiry.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Inquiry Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Description
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {inquiry.description}
                </div>
              </div>

              {/* Lifecycle Actions */}
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Lifecycle Actions
                  </h3>
                  <span className="text-[11px] text-amber-900/70">
                    Current Version: v{inquiry.version}
                  </span>
                </div>

                {/* State Transition Control Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* From 'New' -> 'In Progress' */}
                  {inquiry.status === 'New' && (
                    <button
                      onClick={() => handleStatusChange('In Progress')}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Clock size={14} />
                      Start Handling (Move to In Progress)
                    </button>
                  )}

                  {/* From 'In Progress' -> 'Resolved' */}
                  {inquiry.status === 'In Progress' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('Resolved')}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        Mark as Resolved
                      </button>

                      <button
                        onClick={() => handleStatusChange('New')}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
                      >
                        <RotateCcw size={13} />
                        Return to New Queue
                      </button>
                    </>
                  )}

                  {/* From 'Resolved' -> 'In Progress' (Reopen) */}
                  {inquiry.status === 'Resolved' && !showReopenPrompt && (
                    <button
                      onClick={() => setShowReopenPrompt(true)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300 disabled:opacity-50"
                    >
                      <RotateCcw size={14} />
                      Reopen Inquiry
                    </button>
                  )}
                </div>

                {/* Optional note or Reopening Prompt note input */}
                {(inquiry.status === 'In Progress' || showReopenPrompt) && (
                  <div className="pt-2 border-t border-amber-200/50 space-y-2">
                    <label className="block text-xs font-medium text-gray-700">
                      {showReopenPrompt ? (
                        <span className="text-amber-900 font-semibold">
                          Reason for Reopening (Required):
                        </span>
                      ) : (
                        'Internal note / update reason (optional):'
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={
                          showReopenPrompt
                            ? 'e.g. Customer reported ongoing coffee grinder issue...'
                            : 'Add progress note or resolution detail...'
                        }
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800 text-gray-800"
                      />
                      {showReopenPrompt && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStatusChange('In Progress', note)}
                            disabled={isUpdating || note.trim().length < 5}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Confirm Reopen
                          </button>
                          <button
                            onClick={() => {
                              setShowReopenPrompt(false);
                              setNote('');
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Timeline ("What happened last") */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History size={14} className="text-amber-800" />
                  Activity History & Audit Trail
                </h3>

                <div className="space-y-2.5 border-l-2 border-amber-200 ml-2 pl-4">
                  {activities.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No history logged yet.</p>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="relative group text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-800 border-2 border-white"></div>
                        <div className="flex items-center gap-2 flex-wrap text-gray-500 text-[11px]">
                          <span className="font-semibold text-gray-800">
                            {act.user_name || 'Staff Member'}
                          </span>
                          <span>•</span>
                          <span>{formatDate(act.created_at)}</span>
                          {act.from_status && act.to_status && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono">
                              {act.from_status} <ArrowRight size={10} /> {act.to_status}
                            </span>
                          )}
                        </div>
                        {act.note && (
                          <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
                            {act.note}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
