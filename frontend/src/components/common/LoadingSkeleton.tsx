import React from 'react';

export const InquiryListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3" data-testid="loading-skeleton">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-5 w-48 bg-gray-200 rounded"></div>
                <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-4 w-72 bg-gray-100 rounded"></div>
            </div>
            <div className="h-4 w-24 bg-gray-100 rounded"></div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="h-4 w-32 bg-gray-100 rounded"></div>
            <div className="h-4 w-28 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
