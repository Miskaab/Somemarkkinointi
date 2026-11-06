"use client";

import { useState } from "react";

export default function Home() {
  const [aihe, setAihe] = useState("");
  const [vastaus, setVastaus] = useState("");
  const [ladataan, setLadataan] = useState(false);

  const handleSubmit = () => {
    if (!aihe) return;
    setLadataan(true);


    setTimeout(() => {
      setVastaus(`✨ Instagram-julkaisu aiheesta "${aihe}":\n\nKaipaako hiuksesi uutta ilmettä syksyyn? 💇‍♀️ Varaa aikasi meiltä ja loihdetaan yhdessä unelmiesi tyyli! \n\n#kampaamo #hiustyyli #kauneus #syksy`);
      setLadataan(false);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-xl">

        {/* Otsikko */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Kampaamo Sometyökalu ✂️
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Luo helposti ammattimaiset somepostaukset kampaamollesi.
        </p>

        {/* Haku ja nappi */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Kirjoita aihe (esim. uusi hiusväri, leikkaus...)"
            value={aihe}
            onChange={(e) => setAihe(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-800"
          />
          <select
            value={aihe}
            onChange={(e) => setAihe(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg bg-white text-gray-800"
          >
            <option value="" hidden>Valitse aihe valmiista...</option>
            <option value="Hiusten leikkaus">Hiusten leikkaus</option>
            <option value="Uusi hiusväri">Uusi hiusväri</option>
            <option value="Hääkampaukset varattavissa">Hääkampaukset</option>
            <option value="Hiusten hoito ja hoitotuotteet">Hiusten hoito</option>
            <option value="Tarjoukset ja kampanjat">Tarjoukset ja kampanjat</option>
          </select>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={ladataan}
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold p-3 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {ladataan ? "Generoidaan tekoälyllä..." : "Luo somepostaus"}
          </button>
        </div>

        {/* Loppu vastaus */}
        {vastaus && (
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h2 className="font-semibold text-gray-700 mb-2">Valmis julkaisuehdotus:</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{vastaus}</p>
          </div>
        )}

      </div>
    </main>
  );
}