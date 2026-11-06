import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { aihe } = await req.json();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Olet kampaamon somemarkkinoija. Tee lyhyt, houkutteleva Instagram-julkaisu aiheesta: ${aihe}. Lisää mukaan kuvaidea ja hashtageja.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const teksti = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ei vastausta.";

    return NextResponse.json({ tulos: teksti });
  } catch (error) {
    return NextResponse.json({ error: "Jotain meni pieleen" }, { status: 500 });
  }
}