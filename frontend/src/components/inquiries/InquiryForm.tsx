import React, { useState, useEffect } from 'react';
import { apiRequest, ApiError } from '../../api/client';
import { CreateInquiryInput, User } from '../../types';
import { X, Send, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';
import { ErrorAlert } from '../common/ErrorAlert';

interface InquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateInquiryInput>({
    customer_name: '',
    customer_contact: '',
    subject: '',
    description: '',
    assigned_to_id: null,
    is_restricted: false,
  });

  const [staffList, setStaffList] = useState<User[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<{
    message: string;
    details?: Array<{ field: string; message: string }>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load staff for assignment dropdown
      apiRequest<{ success: boolean; data: User[] }>('/auth/staff')
        .then((res) => {
          if (res.success && res.data) {
            setStaffList(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    } else if (formData.customer_name.trim().length < 2) {
      newErrors.customer_name = 'Customer name must be at least 2 characters';
    }

    if (!formData.customer_contact.trim()) {
      newErrors.customer_contact = 'Customer contact info is required';
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_contact.trim());
      const isPhone = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]{6,20}$/.test(
        formData.customer_contact.trim()
      );
      if (!isEmail && !isPhone) {
        newErrors.customer_contact = 'Please enter a valid email address or phone number';
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest('/inquiries', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      // Reset form on success
      setFormData({
        customer_name: '',
        customer_contact: '',
        subject: '',
        description: '',
        assigned_to_id: null,
        is_restricted: false,
      });
      setErrors({});
      onSuccess();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setServerError({
          message: err.message,
          details: err.details,
        });
      } else {
        setServerError({ message: 'Failed to record customer inquiry. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillSample = () => {
    setFormData({
      customer_name: 'Marcus Vance',
      customer_contact: 'marcus.vance@example.com',
      subject: 'Inquiry regarding cold brew keg delivery schedule',
      description:
        'Customer wishes to set up a bi-weekly delivery of 5-gallon nitro cold brew kegs for their creative agency studio.',
      assigned_to_id: staffList[0]?.id || null,
      is_restricted: false,
    });
    setErrors({});
    setServerError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="inquiry-form-modal"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Record Customer Inquiry</h2>
            <p className="text-xs text-gray-500">
              Capture details from chat, phone, or customer interaction
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mt-4">
            <ErrorAlert
              message={serverError.message}
              details={serverError.details}
              onDismiss={() => setServerError(null)}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Customer Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="customer_name"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                id="customer_name"
                type="text"
                placeholder="e.g. Jane Doe"
                value={formData.customer_name}
                onChange={(e) => {
                  setFormData({ ...formData, customer_name: e.target.value });
                  if (errors.customer_name) setErrors({ ...errors, customer_name: '' });
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                  errors.customer_name
                    ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                    : 'border-gray-200 focus:ring-amber-800'
                }`}
              />
              {errors.customer_name && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.customer_name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="customer_contact"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Contact (Email / Phone) <span className="text-red-500">*</span>
              </label>
              <input
                id="customer_contact"
                type="text"
                placeholder="jane@example.com or +1 555-0144"
                value={formData.customer_contact}
                onChange={(e) => {
                  setFormData({ ...formData, customer_contact: e.target.value });
                  if (errors.customer_contact) setErrors({ ...errors, customer_contact: '' });
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                  errors.customer_contact
                    ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                    : 'border-gray-200 focus:ring-amber-800'
                }`}
              />
              {errors.customer_contact && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.customer_contact}
                </p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="subject"
                className="block text-xs font-semibold text-gray-700"
              >
                Subject <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400">
                {formData.subject.length}/200
              </span>
            </div>
            <input
              id="subject"
              type="text"
              maxLength={200}
              placeholder="Brief summary of inquiry"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: '' });
              }}
              className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                errors.subject
                  ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-200 focus:ring-amber-800'
              }`}
            />
            {errors.subject && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.subject}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-gray-700"
              >
                Description & Notes <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400">
                {formData.description.length}/3000
              </span>
            </div>
            <textarea
              id="description"
              rows={4}
              maxLength={3000}
              placeholder="What is the customer asking for? Include relevant details from the chat or spreadsheet..."
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                errors.description
                  ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-200 focus:ring-amber-800'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.description}
              </p>
            )}
          </div>

          {/* Assignee & Restriction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label
                htmlFor="assigned_to_id"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Assign Staff Member (Optional)
              </label>
              <select
                id="assigned_to_id"
                value={formData.assigned_to_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assigned_to_id: e.target.value ? e.target.value : null,
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-800"
              >
                <option value="">Leave unassigned (Open Triage)</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                id="is_restricted"
                type="checkbox"
                checked={formData.is_restricted}
                onChange={(e) =>
                  setFormData({ ...formData, is_restricted: e.target.checked })
                }
                className="rounded text-amber-900 focus:ring-amber-800 h-4 w-4"
              />
              <label
                htmlFor="is_restricted"
                className="text-xs text-gray-700 font-medium flex items-center gap-1 cursor-pointer select-none"
              >
                <ShieldAlert size={13} className="text-amber-800" />
                Confidential / Management Only
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleFillSample}
              className="text-xs text-amber-900 hover:text-amber-700 font-medium flex items-center gap-1"
            >
              <Sparkles size={13} />
              Fill Sample
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Send size={13} />
                {isSubmitting ? 'Recording...' : 'Record Inquiry'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
