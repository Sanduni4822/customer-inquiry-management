import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

export async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seed...');
    await client.query('BEGIN');

    // Hash default password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Seed Users
    const userInsertQuery = `
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES 
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10),
        ($11, $12, $13, $14, $15)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        department = EXCLUDED.department
      RETURNING id, name, email, role, department;
    `;

    const userRes = await client.query(userInsertQuery, [
      'Sarah Jenkins', 'sarah@coffeeninja.com', hashedPassword, 'staff', 'support',
      'David Chen', 'david@coffeeninja.com', hashedPassword, 'staff', 'sales',
      'Elena Rostova', 'elena@coffeeninja.com', hashedPassword, 'manager', 'management'
    ]);

    const usersMap = new Map<string, string>();
    for (const u of userRes.rows) {
      usersMap.set(u.email, u.id);
    }

    const sarahId = usersMap.get('sarah@coffeeninja.com')!;
    const davidId = usersMap.get('david@coffeeninja.com')!;
    const elenaId = usersMap.get('elena@coffeeninja.com')!;

    // 2. Clear previous demo inquiries if reseeding
    await client.query('DELETE FROM inquiry_activities');
    await client.query('DELETE FROM inquiries');

    // 3. Seed Inquiries
    const inquiriesData = [
      {
        customer_name: 'Arthur Dent',
        customer_contact: 'arthur@hitchhiker.org',
        subject: 'Espresso blend tastes unusually bitter',
        description: 'Customer purchased 2 bags of Dark Ninja Roast on Sunday and noted an unexpected metallic bitterness after brewing.',
        status: 'New',
        assigned_to_id: null,
        created_by_id: sarahId,
        is_restricted: false,
      },
      {
        customer_name: 'Maya Lin',
        customer_contact: '+1-555-0199',
        subject: 'Catering quote for 80-person corporate breakfast',
        description: 'Requires batch brew coffee, oat milk alternatives, and pastry pairings for next Thursday morning.',
        status: 'In Progress',
        assigned_to_id: davidId,
        created_by_id: davidId,
        is_restricted: false,
      },
      {
        customer_name: 'James Holden',
        customer_contact: 'j.holden@cant.org',
        subject: 'Missing batch brew grinder calibration kit',
        description: 'Order #CN-8842 arrived without the adjustment shims and calibration dial manual.',
        status: 'Resolved',
        assigned_to_id: sarahId,
        created_by_id: sarahId,
        is_restricted: false,
      },
      {
        customer_name: 'V.I.P. Corporate Partner (Confidential)',
        customer_contact: 'exec@acmecorp.com',
        subject: 'Executive Boardroom Exclusive Supply Contract',
        description: 'Private negotiation inquiry regarding exclusive estate beans and machine leasing terms. Restricted to management only.',
        status: 'In Progress',
        assigned_to_id: elenaId,
        created_by_id: elenaId,
        is_restricted: true,
      },
    ];

    for (const inq of inquiriesData) {
      const inqRes = await client.query(
        `INSERT INTO inquiries (customer_name, customer_contact, subject, description, status, assigned_to_id, created_by_id, is_restricted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          inq.customer_name,
          inq.customer_contact,
          inq.subject,
          inq.description,
          inq.status,
          inq.assigned_to_id,
          inq.created_by_id,
          inq.is_restricted,
        ]
      );

      const inqId = inqRes.rows[0].id;

      // Seed initial creation activity
      await client.query(
        `INSERT INTO inquiry_activities (inquiry_id, user_id, action, from_status, to_status, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          inqId,
          inq.created_by_id,
          'CREATED',
          null,
          inq.status,
          'Inquiry logged in system during customer contact.',
        ]
      );

      if (inq.status === 'Resolved') {
        await client.query(
          `INSERT INTO inquiry_activities (inquiry_id, user_id, action, from_status, to_status, note)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            inqId,
            sarahId,
            'STATUS_CHANGED',
            'In Progress',
            'Resolved',
            'Replacement shims dispatched via express courier with tracking #EXP-49102.',
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with demo users and inquiries.');
    console.log(`
Seeded Accounts:
1. sarah@coffeeninja.com  | password123 | Role: staff   | Dept: support
2. david@coffeeninja.com  | password123 | Role: staff   | Dept: sales
3. elena@coffeeninja.com  | password123 | Role: manager | Dept: management
    `);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
