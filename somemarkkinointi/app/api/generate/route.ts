import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { topic, channel, tone, includeHashtags } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY puuttuu .env.local -tiedostosta.' }, { status: 500 });
    }

    const hashtagInstruction = includeHashtags 
      ? 'Lisää loppuun 3-4 myyntiä tukevaa hashtagia.' 
      : 'ÄLÄ lisää yhtään hashtagia tekstin loppuun.';

    const promptText = `Olet menestyvän kampaamon markkinoinnin ammattilainen. Kirjoita lyhyt, iskevä ja puhtaasti myynnillinen ${channel}-markkinointipostaus tyylillä "${tone}" aiheesta: "${topic}".

TÄRKEÄÄ:
- Tämä on MAINOS, ei opetusartikkeli tai blogiteksti.
- Myy palvelua tai tuotetta ja ohjaa asiakas toimimaan (esim. varaamaan aika).
- Pysy ytimekkäänä ja napakkana.
- Lisää muutama tyylikäs emoji.
- ${hashtagInstruction}`;

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
            maxOutputTokens: 300,
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

    return NextResponse.json({ text: generatedText });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Palvelinvirhe.' }, { status: 500 });
  }
}