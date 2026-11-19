'use client';

import { useState, useEffect, useCallback } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

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

interface PostItem {
  id: number;
  topic: string;
  channel: string;
  tone: string;
  content: string;
  is_favorite: boolean;
  created_at: string;
}

export default function Home() {
  const { isSignedIn } = useUser();

  const [usageCount, setUsageCount] = useState<number>(0);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [upgrading, setUpgrading] = useState<boolean>(false);

  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState('Instagram');
  const [tone, setTone] = useState('Innostava');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [isWeeklyPlan, setIsWeeklyPlan] = useState(false);

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Tietokannan historia ja suosikit
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');

  const fetchUserStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/user');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.error) {
        setUsageCount(data.usage_count ?? 0);
        setIsPro(Boolean(data.is_pro));
      }
    } catch (err) {
      console.error('Virhe haettaessa käyttäjätietoja:', err);
    }
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (err) {
      console.error('Virhe haettaessa historiaa:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchUserStatus();
    } else {
      setUsageCount(0);
      setIsPro(false);
    }
  }, [isSignedIn, fetchUserStatus]);

  const handleUpgradePro = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setResult(`Virhe: ${data.error}`);
      }
    } catch (err) {
      setResult('Maksusivun avaaminen epäonnistui.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResult('');
    setCopiedId(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, channel, tone, includeHashtags, isWeeklyPlan }),
      });

      const data = await response.json();
      if (data.error) {
        setResult(`Virhe: ${data.error}`);
      } else {
        setResult(data.text);
        if (typeof data.usage_count === 'number') {
          setUsageCount(data.usage_count);
        }
        if (typeof data.is_pro === 'boolean') {
          setIsPro(data.is_pro);
        }

        // Tallennetaan onnistunut tulos heti tietokantaan
        const displayTopic = isWeeklyPlan ? `📅 Viikko: ${topic}` : topic;
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: displayTopic,
            channel,
            tone,
            content: data.text,
          }),
        });
        fetchPosts();
      }
    } catch (err) {
      setResult('Palvelimeen ei saatu yhteyttä.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (post: PostItem) => {
    try {
      const newStatus = !post.is_favorite;
      // Päivitetään UI heti
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_favorite: newStatus } : p))
      );
      await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, is_favorite: newStatus }),
      });
    } catch (err) {
      console.error('Suosikin päivitys epäonnistui:', err);
    }
  };

  const deletePost = async (id: number) => {
    try {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Poisto epäonnistui:', err);
    }
  };

  const copyToClipboard = (text: string, id: string | number) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayedPosts =
    activeTab === 'favorites' ? posts.filter((p) => p.is_favorite) : posts;

  const remainingFree = Math.max(0, 3 - usageCount);

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">

{/* Yläpalkki */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md border border-rose-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {!isSignedIn ? (
            <>
              <p className="text-xs sm:text-sm text-gray-600">
                Kirjaudu sisään tallentaaksesi ja käyttääksesi ilmaiset 3 julkaisua.
              </p>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
                >
                  Kirjaudu sisään
                </button>
              </SignInButton>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <UserButton />
                {isPro ? (
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    ✨ Pro-tilaus aktiivinen
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-gray-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                    Ilmaisia julkaisuja jäljellä: <strong>{remainingFree} / 3</strong>
                  </span>
                )}
              </div>

              {!isPro && (
                <button
                  type="button"
                  onClick={handleUpgradePro}
                  disabled={upgrading}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold transition disabled:opacity-50"
                >
                  {upgrading ? 'Avataan...' : 'Päivitä Pro (19 €/kk)'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Pääkortti */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-rose-100 p-6 sm:p-10 transition-all">

          {/* Otsikkoalue */}
          <div className="text-center space-y-2 mb-6">
            <span className="inline-block bg-rose-100 text-rose-600 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full">
              AI Someassistentti
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Kampaamon Sometyökalu
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Luo yksittäisiä myyntipostauksia tai koko viikon julkaisusuunnitelma.
            </p>
          </div>

          {/* Tilan valinta: Yksittäinen vs. Viikon päivitykset */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-rose-50/80 rounded-2xl mb-6 border border-rose-100">
            <button
              type="button"
              onClick={() => setIsWeeklyPlan(false)}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                !isWeeklyPlan
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ✨ Yksittäinen julkaisu
            </button>
            <button
              type="button"
              onClick={() => setIsWeeklyPlan(true)}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                isWeeklyPlan
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📅 Viikon somesuunnitelma (Ma–Pe)
            </button>
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
                {isWeeklyPlan
                  ? 'Mikä on viikon pääteema tai kampanja?'
                  : 'Mistä aiheesta tehdään julkaisu?'}
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  isWeeklyPlan
                    ? 'Esim. Pikkujoulukauden kampaukset ja kiiltohoidot...'
                    : 'Kirjoita aihe tai valitse alta...'
                }
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

            {/* Hashtag-kytkin */}
            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setIncludeHashtags(!includeHashtags)}>
              <input
                type="checkbox"
                checked={includeHashtags}
                onChange={(e) => setIncludeHashtags(e.target.checked)}
                className="w-4 h-4 text-rose-500 rounded border-gray-300 focus:ring-rose-400 cursor-pointer"
              />
              <span className="text-sm text-gray-600">Lisää hashtagit loppuun</span>
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
                  <span>{isWeeklyPlan ? 'Luodaan viikon julkaisuja...' : 'Generoidaan tekstiä...'}</span>
                </>
              ) : (
                <span>{isWeeklyPlan ? 'Luo viikon somesuunnitelma' : 'Luo julkaisu'}</span>
              )}
            </button>
          </form>

          {/* Tulososio */}
          {result && (
            <div className="mt-8 pt-6 border-t border-rose-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {isWeeklyPlan ? 'Viikon julkaisusuunnitelma:' : 'Valmis teksti:'}
                </h2>

                <button
                  onClick={() => copyToClipboard(result, 'current')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    copiedId === 'current'
                      ? 'bg-emerald-500 text-white scale-105'
                      : 'text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100'
                  }`}
                >
                  {copiedId === 'current' ? '✓ Kopioitu leikepöydälle!' : 'Kopioi'}
                </button>
              </div>

              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base shadow-inner">
                {result}
              </div>

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

        {/* Julkaisuhistoria & Suosikit -osio */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-rose-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tallennetut julkaisut</h2>
              <p className="text-xs text-gray-500">Kaikki luodut postaukset tallentuvat automaattisesti tietokantaan.</p>
            </div>

            {/* Välilehdet: Historia vs Suosikit */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl self-start">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'history'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🕒 Historia ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'favorites'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ⭐ Suosikit ({posts.filter((p) => p.is_favorite).length})
              </button>
            </div>
          </div>

          {displayedPosts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              {activeTab === 'favorites'
                ? 'Ei vielä suosikeiksi merkittyjä julkaisuja. Klikkaa tähteä tallentaaksesi!'
                : 'Ei vielä luotuja julkaisuja. Kokeile luoda ensimmäinen yläpuolelta!'}
            </p>
          ) : (
            <div className="space-y-4">
              {displayedPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white transition shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md">
                        {post.channel}
                      </span>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                        {post.tone}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        {post.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Suosikki-tähti */}
                      <button
                        onClick={() => toggleFavorite(post)}
                        title={post.is_favorite ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
                        className={`p-1.5 rounded-lg transition ${
                          post.is_favorite
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
                        }`}
                      >
                        {post.is_favorite ? '★' : '☆'}
                      </button>

                      {/* Kopioi */}
                      <button
                        onClick={() => copyToClipboard(post.content, post.id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                          copiedId === post.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {copiedId === post.id ? 'Kopioitu!' : 'Kopioi'}
                      </button>

                      {/* Poista */}
                      <button
                        onClick={() => deletePost(post.id)}
                        title="Poista julkaisu"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}