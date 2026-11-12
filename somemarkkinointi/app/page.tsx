'use client';

import { useState } from 'react';

const QUICK_TOPICS = [
  'Syksyn hiustrendit',
  'Balayage-värjäys',
  'Olaplex-hoito',
  'Uudet hiustenpidennykset',
];

const CHANNELS = [
  { id: 'Instagram', label: 'Instagram' },
  { id: 'Facebook', label: 'Facebook' },
  { id: 'TikTok', label: 'TikTok' },
];

const TONES = [
  { id: 'Innostava', label: 'Innostava & Myyvä' },
  { id: 'Asiantunteva', label: 'Asiantunteva & Rauhallinen' },
  { id: 'Rento', label: 'Rento & Leppoisa' },
];

export default function Home() {
  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState('Instagram');
  const [tone, setTone] = useState('Innostava');
  const [includeHashtags, setIncludeHashtags] = useState(true); // Uusi: Hashtag-kytkimen tila
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResult('');
    setCopied(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, channel, tone, includeHashtags }), // Lähetetään myös hashtag-valinta API:lle
      });

      const data = await response.json();
      if (data.error) {
        setResult(`Virhe: ${data.error}`);
      } else {
        setResult(data.text);
      }
    } catch (err) {
      setResult('Palvelimeen ei saatu yhteyttä.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-rose-50 via-white to-pink-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-rose-100 p-6 sm:p-10 transition-all">
        
        {/* Otsikkoalue */}
        <div className="text-center space-y-2 mb-6">
          <span className="inline-block bg-rose-100 text-rose-600 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full">
            Tulossa...
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Kampaamon Sometyökalu
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Luo räätälöityjä julkaisutekstejä somemarkkinointiin.
          </p>
        </div>

        {/* Lomake */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Somekanavan valinta */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Valitse kanava
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setChannel(c.id)}
                  className={`py-2.5 px-3 text-sm font-medium rounded-xl border transition-all ${
                    channel === c.id
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Äänensävy / Tyyli */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Julkaisun tyyli
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                    tone === t.id
                      ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aihekenttä */}
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
              Mistä aiheesta tehdään julkaisu?
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Kirjoita aihe tai valitse alta..."
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition text-gray-800 placeholder-gray-400 shadow-sm"
              disabled={loading}
            />
            
            {/* Pikavalintanapit */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-xs text-gray-400 self-center mr-1">Pikavalinnat:</span>
              {QUICK_TOPICS.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => setTopic(qt)}
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium px-2.5 py-1 rounded-lg transition border border-rose-100"
                >
                  {qt}
                </button>
              ))}
            </div>
          </div>

          {/* Uusi: Hashtag-kytkin (Checkbox) */}
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setIncludeHashtags(!includeHashtags)}>
            <input
              type="checkbox"
              checked={includeHashtags}
              onChange={(e) => setIncludeHashtags(e.target.checked)}
              className="w-4 h-4 text-rose-500 rounded border-gray-300 focus:ring-rose-400 cursor-pointer"
            />
            <span className="text-sm text-gray-600">Lisää hashtagit postauksen loppuun</span>
          </div>

          {/* Generointinappi */}
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generoidaan tekstiä...</span>
              </>
            ) : (
              <span>Luo julkaisu</span>
            )}
          </button>
        </form>

        {/* Tulososio */}
        {result && (
          <div className="mt-8 pt-6 border-t border-rose-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Valmis teksti:
              </h2>
              
              {/* Parannettu kopiointinappi visuaalisella palautteella */}
              <button
                onClick={copyToClipboard}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  copied 
                    ? 'bg-emerald-500 text-white scale-105' 
                    : 'text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100'
                }`}
              >
                {copied ? '✓ Kopioitu leikepöydälle!' : 'Kopioi'}
              </button>
            </div>
            
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base shadow-inner">
              {result}
            </div>

            {/* Uusi: Uudelleengenerointi-nappi tuloksen alle */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading}
                className="text-xs font-semibold text-gray-500 hover:text-rose-600 transition py-2 px-3 rounded-lg hover:bg-rose-50/50 flex items-center gap-1.5"
              >
                🔄 Luo uusi versio samalla aiheella
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}