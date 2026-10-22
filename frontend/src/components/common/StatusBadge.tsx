import React from 'react';
import { InquiryStatus } from '../../types';
import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: InquiryStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const iconSize = isSm ? 13 : 15;

  switch (status) {
    case 'New':
      return (
        <span
          data-testid="status-badge"
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs tracking-wide'
          }`}
        >
          <Sparkles size={iconSize} className="text-blue-500 animate-pulse" />
          <span>New</span>
        </span>
      );
    case 'In Progress':
      return (
        <span
          data-testid="status-badge"
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs tracking-wide'
          }`}
        >
          <Clock size={iconSize} className="text-amber-600" />
          <span>In Progress</span>
        </span>
      );
    case 'Resolved':
      return (
        <span
          data-testid="status-badge"
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs tracking-wide'
          }`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-600" />
          <span>Resolved</span>
        </span>
      );
    default:
      return (
        <span
          data-testid="status-badge"
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
        >
          {status}
        </span>
      );
  }
};
