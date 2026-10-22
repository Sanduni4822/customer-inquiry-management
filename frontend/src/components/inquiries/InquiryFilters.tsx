import React from 'react';
import { InquiryStatus } from '../../types';
import { Search, Filter, UserCheck } from 'lucide-react';

interface InquiryFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: InquiryStatus | 'All';
  onStatusChange: (status: InquiryStatus | 'All') => void;
  assignmentFilter: 'all' | 'me' | 'unassigned';
  onAssignmentChange: (filter: 'all' | 'me' | 'unassigned') => void;
}

export const InquiryFilters: React.FC<InquiryFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  assignmentFilter,
  onAssignmentChange,
}) => {
  const statusOptions: Array<InquiryStatus | 'All'> = [
    'All',
    'New',
    'In Progress',
    'Resolved',
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer, email, phone, or subject..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white transition-all text-gray-800"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Assignment Filter */}
        <div className="flex items-center gap-2">
          <UserCheck size={16} className="text-gray-500 hidden sm:block" />
          <select
            value={assignmentFilter}
            onChange={(e) =>
              onAssignmentChange(e.target.value as 'all' | 'me' | 'unassigned')
            }
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-800"
          >
            <option value="all">All Inquiries</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned (Triage)</option>
          </select>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-2">
          <Filter size={13} /> Status:
        </span>
        {statusOptions.map((opt) => {
          const isActive = status === opt;
          return (
            <button
              key={opt}
              onClick={() => onStatusChange(opt)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-amber-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
