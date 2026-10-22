import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { pool } from '../src/config/db';
import { env } from '../src/config/env';

// Mock DB pool
vi.mock('../src/config/db', () => {
  const mPool = {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  };
  return { pool: mPool, query: mPool.query };
});

describe('Backend Security, Validation & Business Rules', () => {
  const staffToken = jwt.sign(
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Sarah Jenkins',
      email: 'sarah@coffeeninja.com',
      role: 'staff',
      department: 'support',
    },
    env.JWT_SECRET
  );

  const managerToken = jwt.sign(
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Elena Rostova',
      email: 'elena@coffeeninja.com',
      role: 'manager',
      department: 'management',
    },
    env.JWT_SECRET
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Authentication & Access Boundary Enforcement', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/inquiries');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects access to restricted inquiry with 403 Forbidden when accessed by unauthorized staff', async () => {
      const restrictedInquiryId = '33333333-3333-3333-3333-333333333333';

      (pool.query as any).mockResolvedValueOnce({
        rows: [
          {
            id: restrictedInquiryId,
            customer_name: 'VIP Client',
            customer_contact: 'vip@acme.com',
            subject: 'Confidential Tender',
            description: 'Restricted high-level enterprise contract.',
            status: 'In Progress',
            is_restricted: true,
            assigned_to_id: '99999999-9999-9999-9999-999999999999', // Not Sarah
            created_by_id: '99999999-9999-9999-9999-999999999999',
            version: 1,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/inquiries/${restrictedInquiryId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Input Validation Enforcement', () => {
    it('rejects inquiry creation when required fields are missing or contact is invalid', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customer_name: 'J', // Too short (min 2)
          customer_contact: 'not-an-email-or-phone', // Invalid contact
          subject: '', // Missing subject
          description: 'Short', // Too short (min 10)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('3. Status Transition & State Machine Business Rules', () => {
    it('rejects direct transition from "New" to "Resolved" without being In Progress', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      (pool.connect as any).mockResolvedValueOnce(mockClient);

      // Current record is 'New'
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              id: '44444444-4444-4444-4444-444444444444',
              status: 'New',
              version: 1,
              is_restricted: false,
              assigned_to_id: null,
            },
          ],
        }) // SELECT for update
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .patch('/api/inquiries/44444444-4444-4444-4444-444444444444/status')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'Resolved',
          version: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
      expect(res.body.error.message).toContain('In Progress');
    });

    it('rejects reopening a "Resolved" inquiry back to "In Progress" without an explanatory note', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      (pool.connect as any).mockResolvedValueOnce(mockClient);

      // Current record is 'Resolved'
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              id: '44444444-4444-4444-4444-444444444444',
              status: 'Resolved',
              version: 2,
              is_restricted: false,
              assigned_to_id: null,
            },
          ],
        })
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .patch('/api/inquiries/44444444-4444-4444-4444-444444444444/status')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'In Progress',
          version: 2,
          // note is omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
      expect(res.body.error.message).toContain('explanation note');
    });
  });

  describe('4. Optimistic Concurrency Control (Stale Data Detection)', () => {
    it('returns 409 Conflict when updating with an outdated version', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      (pool.connect as any).mockResolvedValueOnce(mockClient);

      // Current record in DB is version 3, but client submitted version 2
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              id: '55555555-5555-5555-5555-555555555555',
              status: 'In Progress',
              version: 3,
              is_restricted: false,
              assigned_to_id: null,
            },
          ],
        })
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .patch('/api/inquiries/55555555-5555-5555-5555-555555555555/status')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'Resolved',
          version: 2, // Stale!
          note: 'Done',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('STALE_DATA');
      expect(res.body.error.current_version).toBe(3);
    });
  });
});
