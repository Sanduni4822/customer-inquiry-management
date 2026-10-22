import React, { useState, useEffect, useCallback } from 'react';
import { Inquiry, InquiryStatus } from '../types';
import { apiRequest } from '../api/client';
import { InquiryFilters } from '../components/inquiries/InquiryFilters';
import { InquiryList } from '../components/inquiries/InquiryList';
import { InquiryForm } from '../components/inquiries/InquiryForm';
import { InquiryDetailModal } from '../components/inquiries/InquiryDetailModal';
import { InquiryListSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Plus, RefreshCw } from 'lucide-react';

export const InquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'All'>('All');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'me' | 'unassigned'>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (statusFilter !== 'All') params.append('status', statusFilter);
    if (assignmentFilter !== 'all') params.append('assigned_to', assignmentFilter);

    try {
      const res = await apiRequest<{
        success: boolean;
        data: { inquiries: Inquiry[]; total: number };
      }>(`/inquiries?${params.toString()}`);

      if (res.success && res.data) {
        setInquiries(res.data.inquiries || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inquiries. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, assignmentFilter]);

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchInquiries();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchInquiries]);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setAssignmentFilter('all');
  };

  const isFiltered =
    search.trim() !== '' || statusFilter !== 'All' || assignmentFilter !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Customer Inquiries
            </h1>
            <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
              {inquiries.length} {inquiries.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Track customer requests, assignments, and resolution status in real time
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchInquiries()}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            title="Refresh inquiries"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Record Inquiry</span>
          </button>
        </div>
      </div>

      {/* Filters (Search & Status Pills) */}
      <InquiryFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        assignmentFilter={assignmentFilter}
        onAssignmentChange={setAssignmentFilter}
      />

      {/* Error State */}
      {error && (
        <ErrorAlert message={error} onRetry={fetchInquiries} onDismiss={() => setError(null)} />
      )}

      {/* Content: Skeleton, Empty, or List */}
      {isLoading ? (
        <InquiryListSkeleton />
      ) : inquiries.length === 0 ? (
        <EmptyState
          title={isFiltered ? 'No matching inquiries' : 'No inquiries recorded yet'}
          description={
            isFiltered
              ? 'Try adjusting your search keywords or clearing active filters.'
              : 'Log customer inquiries here to track ownership, status, and what happened last.'
          }
          isFiltered={isFiltered}
          onClearFilters={handleClearFilters}
          onNewInquiry={() => setIsFormOpen(true)}
        />
      ) : (
        <InquiryList
          inquiries={inquiries}
          onSelectInquiry={(inq) => setSelectedInquiryId(inq.id)}
        />
      )}

      {/* New Inquiry Modal */}
      <InquiryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchInquiries();
        }}
      />

      {/* Inquiry Detail & Lifecycle Modal */}
      {selectedInquiryId && (
        <InquiryDetailModal
          inquiryId={selectedInquiryId}
          onClose={() => setSelectedInquiryId(null)}
          onUpdated={() => {
            fetchInquiries();
          }}
        />
      )}
    </div>
  );
};
