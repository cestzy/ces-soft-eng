import { neon } from '@neondatabase/serverless';

// GET all equipment for the Admin Stock view
export async function GET() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const items = await sql`SELECT * FROM equipment ORDER BY added_at DESC`;
    return new Response(JSON.stringify({ items }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST new equipment (Admin adding items)
export async function POST(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { id, name, category } = await req.json();

  try {
    await sql`
      INSERT INTO equipment (id, name, category, status)
      VALUES (${id}, ${name}, ${category}, 'available')
    `;
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}