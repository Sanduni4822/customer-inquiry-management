import { Request, Response } from 'express';
import { pool } from '../config/db';
import {
  CreateInquiryInput,
  UpdateInquiryStatusInput,
  ListInquiriesQuery,
  InquiryStatus,
} from '../schemas/inquiry.schema';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validates state transitions for inquiries
 */
function validateStatusTransition(
  currentStatus: InquiryStatus,
  targetStatus: InquiryStatus,
  note?: string
): { valid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  // New -> In Progress: Allowed
  if (currentStatus === 'New' && targetStatus === 'In Progress') {
    return { valid: true };
  }

  // New -> Resolved: Disallowed (Must be In Progress first)
  if (currentStatus === 'New' && targetStatus === 'Resolved') {
    return {
      valid: false,
      error: 'Inquiries must be marked "In Progress" before they can be marked "Resolved".',
    };
  }

  // In Progress -> Resolved: Allowed
  if (currentStatus === 'In Progress' && targetStatus === 'Resolved') {
    return { valid: true };
  }

  // In Progress -> New: Allowed (Return to triage)
  if (currentStatus === 'In Progress' && targetStatus === 'New') {
    return { valid: true };
  }

  // Resolved -> In Progress: Allowed only if explanation note is provided
  if (currentStatus === 'Resolved' && targetStatus === 'In Progress') {
    if (!note || note.trim().length < 5) {
      return {
        valid: false,
        error: 'Reopening a resolved inquiry requires an explanation note (minimum 5 characters).',
      };
    }
    return { valid: true };
  }

  // Resolved -> New: Disallowed
  if (currentStatus === 'Resolved' && targetStatus === 'New') {
    return {
      valid: false,
      error: 'Resolved inquiries cannot be reset directly to "New". Reopen to "In Progress" with a reason note.',
    };
  }

  return { valid: false, error: `Invalid transition from ${currentStatus} to ${targetStatus}.` };
}

/**
 * POST /api/inquiries
 * Create a new customer inquiry
 */
export const createInquiry = async (
  req: Request,
  res: Response
) => {
  const user = req.user!;
  const {
    customer_name,
    customer_contact,
    subject,
    description,
    assigned_to_id,
    is_restricted = false,
  } = req.body as CreateInquiryInput;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Duplicate Check: Check for identical customer_contact & subject submitted in the last 5 minutes
    const duplicateCheck = await client.query(
      `SELECT id, created_at FROM inquiries 
       WHERE LOWER(customer_contact) = LOWER($1) 
         AND LOWER(subject) = LOWER($2)
         AND created_at > (NOW() - INTERVAL '5 minutes')
       LIMIT 1`,
      [customer_contact, subject]
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_SUBMISSION',
          message:
            'A very similar inquiry was submitted for this customer within the last 5 minutes. Please verify in the overview before resubmitting.',
          existingInquiryId: duplicateCheck.rows[0].id,
        },
      });
    }

    // Insert inquiry
    const insertQuery = `
      INSERT INTO inquiries (
        customer_name, 
        customer_contact, 
        subject, 
        description, 
        status, 
        assigned_to_id, 
        created_by_id, 
        is_restricted, 
        version
      )
      VALUES ($1, $2, $3, $4, 'New', $5, $6, $7, 1)
      RETURNING *;
    `;

    const result = await client.query(insertQuery, [
      customer_name,
      customer_contact,
      subject,
      description,
      assigned_to_id || null,
      user.id,
      Boolean(is_restricted),
    ]);

    const newInquiry = result.rows[0];

    // Log creation in activities
    await client.query(
      `INSERT INTO inquiry_activities (inquiry_id, user_id, action, from_status, to_status, note)
       VALUES ($1, $2, 'CREATED', NULL, 'New', $3)`,
      [
        newInquiry.id,
        user.id,
        assigned_to_id
          ? 'Inquiry created and assigned'
          : 'Inquiry recorded by staff member',
      ]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      data: newInquiry,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating inquiry:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record customer inquiry' },
    });
  } finally {
    client.release();
  }
};

/**
 * GET /api/inquiries
 * List inquiries with search, status filter, and role-based access filtering
 */
export const getInquiries = async (
  req: Request,
  res: Response
) => {
  const user = req.user!;
  const { search, status, assigned_to } = req.query as unknown as ListInquiriesQuery;

  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based Access Rule:
    // Regular staff can only see non-restricted inquiries OR inquiries assigned to themselves.
    // Managers can see all inquiries.
    if (user.role !== 'manager') {
      conditions.push(
        `(i.is_restricted = FALSE OR i.assigned_to_id = $${paramIndex})`
      );
      params.push(user.id);
      paramIndex++;
    }

    // Status filter
    if (status && status !== 'All') {
      conditions.push(`i.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Assigned To filter
    if (assigned_to === 'me') {
      conditions.push(`i.assigned_to_id = $${paramIndex}`);
      params.push(user.id);
      paramIndex++;
    } else if (assigned_to === 'unassigned') {
      conditions.push(`i.assigned_to_id IS NULL`);
    } else if (assigned_to && isValidUuid(assigned_to)) {
      conditions.push(`i.assigned_to_id = $${paramIndex}`);
      params.push(assigned_to);
      paramIndex++;
    }

    // Search filter across name, contact, subject, and description
    if (search && search.trim() !== '') {
      conditions.push(`(
        i.customer_name ILIKE $${paramIndex} OR 
        i.customer_contact ILIKE $${paramIndex} OR 
        i.subject ILIKE $${paramIndex} OR 
        i.description ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listQuery = `
      SELECT 
        i.id,
        i.customer_name,
        i.customer_contact,
        i.subject,
        i.description,
        i.status,
        i.is_restricted,
        i.version,
        i.created_at,
        i.updated_at,
        u_assigned.id AS assigned_to_id,
        u_assigned.name AS assigned_to_name,
        u_assigned.department AS assigned_to_department,
        u_created.name AS created_by_name
      FROM inquiries i
      LEFT JOIN users u_assigned ON i.assigned_to_id = u_assigned.id
      LEFT JOIN users u_created ON i.created_by_id = u_created.id
      ${whereClause}
      ORDER BY i.created_at DESC;
    `;

    const result = await pool.query(listQuery, params);

    return res.status(200).json({
      success: true,
      data: {
        inquiries: result.rows,
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve inquiries' },
    });
  }
};

/**
 * GET /api/inquiries/:id
 * Retrieve a single inquiry by ID along with its activity timeline
 */
export const getInquiryById = async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  if (!isValidUuid(id)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid inquiry ID format (must be UUID)' },
    });
  }

  try {
    const inquiryResult = await pool.query(
      `SELECT 
        i.id,
        i.customer_name,
        i.customer_contact,
        i.subject,
        i.description,
        i.status,
        i.is_restricted,
        i.version,
        i.created_at,
        i.updated_at,
        i.assigned_to_id,
        u_assigned.name AS assigned_to_name,
        u_assigned.email AS assigned_to_email,
        u_assigned.department AS assigned_to_department,
        i.created_by_id,
        u_created.name AS created_by_name
      FROM inquiries i
      LEFT JOIN users u_assigned ON i.assigned_to_id = u_assigned.id
      LEFT JOIN users u_created ON i.created_by_id = u_created.id
      WHERE i.id = $1`,
      [id]
    );

    if (inquiryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Inquiry not found' },
      });
    }

    const inquiry = inquiryResult.rows[0];

    // Enforce Access Boundary:
    // If inquiry is restricted, only managers or the assigned staff member can view it.
    if (
      inquiry.is_restricted &&
      user.role !== 'manager' &&
      inquiry.assigned_to_id !== user.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message:
            'Access denied. This is a restricted inquiry accessible only to management or the designated assignee.',
        },
      });
    }

    // Fetch activity timeline
    const activitiesResult = await pool.query(
      `SELECT 
        a.id,
        a.action,
        a.from_status,
        a.to_status,
        a.note,
        a.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.role AS user_role
      FROM inquiry_activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.inquiry_id = $1
      ORDER BY a.created_at ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        inquiry,
        activities: activitiesResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching inquiry by id:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve inquiry details' },
    });
  }
};

/**
 * PATCH /api/inquiries/:id/status
 * Update status, assignment, and add activity note with optimistic locking
 */
export const updateInquiryStatus = async (
  req: Request,
  res: Response
) => {
  const user = req.user!;
  const { id } = req.params;
  const { status: targetStatus, version, note, assigned_to_id } = req.body as UpdateInquiryStatusInput;

  if (!isValidUuid(id)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid inquiry ID format (must be UUID)' },
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current record
    const currentRes = await client.query(
      `SELECT id, status, version, is_restricted, assigned_to_id 
       FROM inquiries 
       WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Inquiry not found' },
      });
    }

    const current = currentRes.rows[0];

    // 2. Access Control Rule
    if (
      current.is_restricted &&
      user.role !== 'manager' &&
      current.assigned_to_id !== user.id
    ) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message:
            'Access denied. You do not have permission to modify this restricted inquiry.',
        },
      });
    }

    // 3. Stale Data Handling (Optimistic Concurrency Control)
    // If the client's provided version does not match DB, another tab or user updated it!
    if (current.version !== version) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: {
          code: 'STALE_DATA',
          message:
            'This inquiry has been modified by another user or in another tab since you opened it. Please refresh to see the latest changes.',
          current_version: current.version,
          current_status: current.status,
        },
      });
    }

    // 4. Validate Status Transition Business Rules
    const currentStatus = current.status as InquiryStatus;
    const transitionCheck = validateStatusTransition(
      currentStatus,
      targetStatus,
      note
    );

    if (!transitionCheck.valid) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: transitionCheck.error,
        },
      });
    }

    // 5. Update Inquiry
    const shouldUpdateAssignment = assigned_to_id !== undefined;
    const newAssignedTo = shouldUpdateAssignment
      ? assigned_to_id
      : current.assigned_to_id;

    const updateRes = await client.query(
      `UPDATE inquiries 
       SET status = $1, 
           version = version + 1, 
           assigned_to_id = $2, 
           updated_at = NOW()
       WHERE id = $3 AND version = $4
       RETURNING *`,
      [targetStatus, newAssignedTo, id, version]
    );

    const updatedInquiry = updateRes.rows[0];

    // 6. Record Activity
    let action = 'STATUS_CHANGED';
    let activityNote = note || null;

    if (currentStatus === targetStatus && shouldUpdateAssignment) {
      action = 'ASSIGNED';
      activityNote = activityNote || 'Assigned staff updated';
    } else if (currentStatus === 'Resolved' && targetStatus === 'In Progress') {
      action = 'REOPENED';
    }

    await client.query(
      `INSERT INTO inquiry_activities (inquiry_id, user_id, action, from_status, to_status, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        user.id,
        action,
        currentStatus,
        targetStatus,
        activityNote || `Status updated from ${currentStatus} to ${targetStatus}`,
      ]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      data: updatedInquiry,
      message: `Status successfully updated to ${targetStatus}`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating inquiry status:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update inquiry status' },
    });
  } finally {
    client.release();
  }
};
