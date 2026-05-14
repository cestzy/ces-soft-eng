import { neon } from '@neondatabase/serverless';

export async function PATCH(req, { params }) {
  const sql = neon(process.env.DATABASE_URL);
  const { id } = params;

  try {
    // 1. Mark equipment as available
    await sql`UPDATE equipment SET status = 'available' WHERE id = ${id}`;
    
    // 2. Mark the transaction as completed
    await sql`UPDATE transactions SET status = 'returned', return_date = NOW() WHERE equipment_id = ${id} AND status = 'active'`;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const sql = neon(process.env.DATABASE_URL);
  const { id } = params;

  try {
    await sql`DELETE FROM equipment WHERE id = ${id}`;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Cannot delete item with active history." }), { status: 500 });
  }
}