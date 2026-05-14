import { neon } from '@neondatabase/serverless';

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL);
  
  // Get the email from the URL search parameters
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response(
      JSON.stringify({ error: "Email parameter is required" }), 
      { status: 400 }
    );
  }

  try {
    // JOIN the transactions with equipment to get the item names
    // Filter by 'active' status so returned items don't show up in 'Current Items'
    const items = await sql`
      SELECT 
        e.id, 
        e.name, 
        e.category, 
        t.borrow_date 
      FROM transactions t
      JOIN equipment e ON t.equipment_id = e.id
      WHERE LOWER(t.user_email) = LOWER(${email}) 
      AND t.status = 'active'
      ORDER BY t.borrow_date DESC
    `;

    return new Response(JSON.stringify({ items }), { status: 200 });
  } catch (error) {
    console.error("Fetch items error:", error);
    return new Response(
      JSON.stringify({ error: "Could not retrieve your items from the database." }), 
      { status: 500 }
    );
  }
}