import React from 'react';
import { Inquiry } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Lock, UserCheck, ChevronRight, Calendar } from 'lucide-react';

interface InquiryListProps {
  inquiries: Inquiry[];
  onSelectInquiry: (inquiry: Inquiry) => void;
}

export const InquiryList: React.FC<InquiryListProps> = ({
  inquiries,
  onSelectInquiry,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-3" data-testid="inquiry-list">
      {inquiries.map((inquiry) => (
        <div
          key={inquiry.id}
          onClick={() => onSelectInquiry(inquiry)}
          className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-700/40 hover:shadow-md transition-all cursor-pointer relative"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            {/* Main Info */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 group-hover:text-amber-900 transition-colors text-base truncate">
                  {inquiry.subject}
                </span>
                <StatusBadge status={inquiry.status} size="sm" />
                {inquiry.is_restricted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                    <Lock size={11} /> Confidential
                  </span>
                )}
              </div>

              {/* Customer details */}
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <span className="font-medium text-gray-700">
                  {inquiry.customer_name}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">{inquiry.customer_contact}</span>
              </div>

              {/* Description preview */}
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {inquiry.description}
              </p>
            </div>

            {/* Date & Assignee */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={13} />
                <span>{formatDate(inquiry.created_at)}</span>
              </div>

              <div className="flex items-center gap-1 text-xs">
                {inquiry.assigned_to_name ? (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/60 font-medium px-2 py-0.5 rounded-md text-[11px]">
                    <UserCheck size={12} className="text-amber-700" />
                    {inquiry.assigned_to_name}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                    Unassigned
                  </span>
                )}
                <ChevronRight
                  size={16}
                  className="text-gray-300 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all hidden sm:block ml-1"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
