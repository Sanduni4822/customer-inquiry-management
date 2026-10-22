import React from 'react';
import { Inbox, Plus, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  onNewInquiry?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No inquiries found',
  description = 'Get started by logging a new customer inquiry.',
  isFiltered = false,
  onClearFilters,
  onNewInquiry,
}) => {
  return (
    <div
      data-testid="empty-state"
      className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center flex flex-col items-center justify-center my-6"
    >
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-800 mb-4">
        <Inbox size={28} />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>

      <div className="flex items-center gap-3">
        {isFiltered && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
          >
            <RefreshCw size={13} />
            Clear Filters
          </button>
        )}

        {onNewInquiry && (
          <button
            onClick={onNewInquiry}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={15} />
            Record Inquiry
          </button>
        )}
      </div>
    </div>
  );
};
