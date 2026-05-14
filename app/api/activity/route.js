import { neon } from '@neondatabase/serverless';

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // We join transactions with equipment to get the actual item name
    const activity = await sql`
      SELECT 
        t.id,
        t.user_name,
        t.status,
        t.borrow_date,
        e.name as equipment_name
      FROM transactions t
      JOIN equipment e ON t.equipment_id = e.id
      ORDER BY t.borrow_date DESC
      LIMIT 10
    `;

    return new Response(JSON.stringify({ activity }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}