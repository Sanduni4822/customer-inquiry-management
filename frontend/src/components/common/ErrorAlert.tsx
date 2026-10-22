import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  details?: Array<{ field: string; message: string }>;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  details,
  onRetry,
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 my-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{message}</h4>
            {details && details.length > 0 && (
              <ul className="text-xs list-disc list-inside space-y-0.5 text-red-700 mt-1">
                {details.map((d, index) => (
                  <li key={index}>
                    <span className="font-medium capitalize">{d.field.replace('_', ' ')}</span>:{' '}
                    {d.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-red-400 hover:text-red-700 rounded-lg"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
