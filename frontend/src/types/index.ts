export type InquiryStatus = 'New' | 'In Progress' | 'Resolved';

export type UserRole = 'staff' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface Inquiry {
  id: string;
  customer_name: string;
  customer_contact: string;
  subject: string;
  description: string;
  status: InquiryStatus;
  is_restricted: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  assigned_to_department?: string | null;
  created_by_name?: string | null;
}

export interface InquiryActivity {
  id: string;
  action: string;
  from_status: InquiryStatus | null;
  to_status: InquiryStatus | null;
  note: string | null;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
}

export interface CreateInquiryInput {
  customer_name: string;
  customer_contact: string;
  subject: string;
  description: string;
  assigned_to_id?: string | null;
  is_restricted?: boolean;
}

export interface UpdateInquiryStatusInput {
  status: InquiryStatus;
  version: number;
  note?: string;
  assigned_to_id?: string | null;
}
