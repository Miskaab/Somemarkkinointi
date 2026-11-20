import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Hae kirjautuneen käyttäjän historia ja suosikit
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Kirjaudu ensin sisään.' }, { status: 401 });
    }

    const posts = await sql`
      SELECT * FROM posts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 30
    `;
    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Tallenna uusi julkaisu kirjautuneen käyttäjän historiaan
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Kirjaudu ensin sisään.' }, { status: 401 });
    }

    const { topic, channel, tone, content } = await request.json();
    const result = await sql`
      INSERT INTO posts (user_id, topic, channel, tone, content)
      VALUES (${userId}, ${topic}, ${channel}, ${tone}, ${content})
      RETURNING *
    `;
    return NextResponse.json({ post: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Päivitä suosikki-tila vain oman käyttäjän julkaisulle
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Kirjaudu ensin sisään.' }, { status: 401 });
    }

    const { id, is_favorite } = await request.json();
    const result = await sql`
      UPDATE posts
      SET is_favorite = ${is_favorite}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Julkaisua ei löytynyt.' }, { status: 404 });
    }

    return NextResponse.json({ post: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Poista julkaisu vain jos se kuuluu kirjautuneelle käyttäjälle
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Kirjaudu ensin sisään.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleted = await sql`
      DELETE FROM posts
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Julkaisua ei löytynyt.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}