import { z } from 'zod';

export const InquiryStatusEnum = z.enum(['New', 'In Progress', 'Resolved']);
export type InquiryStatus = z.infer<typeof InquiryStatusEnum>;

export const createInquirySchema = z.object({
  customer_name: z
    .string({ required_error: 'Customer name is required' })
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name cannot exceed 100 characters'),
  customer_contact: z
    .string({ required_error: 'Customer contact is required' })
    .trim()
    .min(5, 'Contact info must be at least 5 characters')
    .max(100, 'Contact info cannot exceed 100 characters')
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isPhone = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]{6,20}$/.test(val);
        return isEmail || isPhone;
      },
      { message: 'Contact must be a valid email address or phone number' }
    ),
  subject: z
    .string({ required_error: 'Subject is required' })
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(3000, 'Description cannot exceed 3000 characters'),
  assigned_to_id: z.string().uuid().nullable().optional(),
  is_restricted: z.boolean().optional().default(false),
});

export const updateInquiryStatusSchema = z.object({
  status: InquiryStatusEnum,
  version: z.number().int().positive('Version must be a positive integer'),
  note: z.string().trim().max(1000).optional(),
  assigned_to_id: z.string().uuid().nullable().optional(),
});

export const listInquiriesQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['New', 'In Progress', 'Resolved', 'All']).optional().default('All'),
  assigned_to: z.string().trim().optional(), // 'me', 'unassigned', or UUID
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;
export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;
