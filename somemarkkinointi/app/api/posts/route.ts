import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Hae historia ja suosikit
export async function GET() {
  try {
    const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC LIMIT 30`;
    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Tallenna uusi julkaisu historiaan
export async function POST(request: Request) {
  try {
    const { topic, channel, tone, content } = await request.json();
    const result = await sql`
      INSERT INTO posts (topic, channel, tone, content)
      VALUES (${topic}, ${channel}, ${tone}, ${content})
      RETURNING *
    `;
    return NextResponse.json({ post: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Päivitä suosikki-tila (tähti päälle/pois)
export async function PATCH(request: Request) {
  try {
    const { id, is_favorite } = await request.json();
    const result = await sql`
      UPDATE posts SET is_favorite = ${is_favorite} WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json({ post: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Poista julkaisu
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await sql`DELETE FROM posts WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}