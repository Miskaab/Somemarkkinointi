import { auth, currentUser } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Kirjaudu ensin sisään.' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? '';

    const rows = await sql`
      INSERT INTO users (id, email, usage_count, is_pro)
      VALUES (${userId}, ${email}, 0, false)
      ON CONFLICT (id) DO UPDATE
      SET email = COALESCE(NULLIF(EXCLUDED.email, ''), users.email)
      RETURNING id, email, usage_count, is_pro
    `;

    return NextResponse.json({
      user: rows[0],
      usage_count: rows[0].usage_count,
      is_pro: rows[0].is_pro,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Käyttäjätietojen haku epäonnistui.' },
      { status: 500 }
    );
  }
}