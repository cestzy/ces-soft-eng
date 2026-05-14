import { neon } from '@neondatabase/serverless';

export async function POST(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { email, password } = await req.json();

  try {
    // 1. Look for the user in your 'authorized_users' table
    // We use LOWER() to ensure login is not case-sensitive
    const users = await sql`
      SELECT email, name, role, password 
      FROM authorized_users 
      WHERE LOWER(email) = LOWER(${email})
    `;

    // 2. Check if user exists
    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: "This email is not registered in the school system." }), 
        { status: 401 }
      );
    }

    const user = users[0];

    // 3. Verify Password (Plain text for your mockup/demo)
    if (user.password !== password) {
      return new Response(
        JSON.stringify({ error: "Incorrect password. Please try again." }), 
        { status: 401 }
      );
    }

    // 4. Success: Send back the Name and Role for the Dashboard Profile
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          email: user.email,
          name: user.name,
          role: user.role
        } 
      }), 
      { status: 200 }
    );

  } catch (error) {
    console.error("Login Error:", error);
    return new Response(
      JSON.stringify({ error: "Database connection failed. Check your Neon URL." }), 
      { status: 500 }
    );
  }
}