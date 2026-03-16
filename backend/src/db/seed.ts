import bcrypt from 'bcryptjs';
import { pool } from './pool';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');

    const hash = await bcrypt.hash('IBH@admin2024!', 12);
    await client.query(
      `INSERT INTO admins (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['IBH Admin', 'admin@ibhcompany.com', hash, 'super_admin']
    );

    console.log('✅ Seed complete.');
    console.log('   Admin email:    admin@ibhcompany.com');
    console.log('   Admin password: IBH@admin2024!');
    console.log('   ⚠️  Change password after first login!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
