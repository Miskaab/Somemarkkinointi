import { auth, currentUser } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);
const FREE_LIMIT = 3;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Kirjaudu ensin sisään.' }, { status: 401 });
    }

    let rows = await sql`
      SELECT usage_count, is_pro
      FROM users
      WHERE id = ${userId}
    `;

    let user = rows[0];

    if (!user) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? '';

      const inserted = await sql`
        INSERT INTO users (id, email, usage_count, is_pro)
        VALUES (${userId}, ${email}, 0, false)
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
        RETURNING usage_count, is_pro
      `;
      user = inserted[0];
    }

    if (!user.is_pro && user.usage_count >= FREE_LIMIT) {
      return NextResponse.json(
        { error: 'Ilmaiset 3 julkaisua on käytetty. Päivitä Pro-versioon jatkaaksesi.' },
        { status: 403 }
      );
    }

    const { topic, channel, tone, includeHashtags, isWeeklyPlan } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY puuttuu .env.local -tiedostosta.' }, { status: 500 });
    }

    const hashtagInstruction = includeHashtags
      ? 'Lisää loppuun 3-4 myyntiä tukevaa hashtagia.'
      : 'ÄLÄ lisää yhtään hashtagia tekstin loppuun.';

    let promptText = '';

    if (isWeeklyPlan) {
      promptText = `Olet menestyvän kampaamon markkinoinnin ammattilainen. Luo KOKO VIIKON (Maanantai - Perjantai, 5 eri postausta) myynnillinen ${channel}-julkaisusuunnitelma tyylillä "${tone}" teemasta: "${topic}".

TÄRKEÄÄ:
- Tee 5 lyhyttä, iskevää ja myyvää mainospostausta (Maanantai, Tiistai, Keskiviikko, Torstai, Perjantai).
- Erottele päivät selkeästi otsikoilla (esim. 📅 MAANANTAI:).
- Jokaisessa postauksessa pitää olla selkeä koukku ja toimintakehoitus (esim. ajanvaraus).
- Lisää muutama tyylikäs emoji jokaiseen päivään.
- ${hashtagInstruction}`;
    } else {
      promptText = `Olet menestyvän kampaamon markkinoinnin ammattilainen. Kirjoita lyhyt, iskevä ja puhtaasti myynnillinen ${channel}-markkinointipostaus tyylillä "${tone}" aiheesta: "${topic}".

TÄRKEÄÄ:
- Tämä on MAINOS, ei opetusartikkeli tai blogiteksti.
- Myy palvelua tai tuotetta ja ohjaa asiakas toimimaan (esim. varaamaan aika).
- Pysy ytimekkäänä ja napakkana.
- Lisää muutama tyylikäs emoji.
- ${hashtagInstruction}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error?.message || 'Virhe API-kutsussa' }, { status: response.status });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Vastausta ei saatu.';

    const updated = await sql`
      UPDATE users
      SET usage_count = usage_count + 1
      WHERE id = ${userId}
      RETURNING usage_count, is_pro
    `;

    return NextResponse.json({
      text: generatedText,
      usage_count: updated[0].usage_count,
      is_pro: updated[0].is_pro,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Palvelinvirhe.' }, { status: 500 });
  }
}