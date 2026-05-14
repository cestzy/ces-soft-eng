// app/api/borrow/route.js
import { neon } from '@neondatabase/serverless';

export async function POST(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { equipmentId, userEmail, userName } = await req.json();

  try {
    // We use LOWER() to make sure 'Student1' matches 'student1'
    const userCheck = await sql`
      SELECT * FROM authorized_users 
      WHERE LOWER(email) = LOWER(${userEmail})
    `;

    if (userCheck.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not registered. Please sign up officially first." }), 
        { status: 403 }
      );
    }

    // Success logic...
    await sql`UPDATE equipment SET status = 'borrowed' WHERE id = ${equipmentId}`;
    await sql`INSERT INTO transactions (equipment_id, user_email, user_name) VALUES (${equipmentId}, ${userEmail}, ${userName})`;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}