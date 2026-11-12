import Link from "next/link";


export default function AboutPage() {
    return (
        <main className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-xl">
                <Link href="/about" className="hover:underline">
                    About us
                </Link>
                <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                    Tietoa Tekijästä
                </h1>

                <p className="text-gray-600 mb-4 leading-relaxed">
                    Lisätiedot Tulossa!
                </p>

                <div className="mb-6">
                    <h2 className="font-semibold text-gray-700 mb-2">Projektissa käytetyt teknologiat:</h2>
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-pink-100 text-pink-700 text-sm px-3 py-1 rounded-full font-medium">Next.js (App Router)</span>
                        <span className="bg-pink-100 text-pink-700 text-sm px-3 py-1 rounded-full font-medium">TypeScript</span>
                        <span className="bg-pink-100 text-pink-700 text-sm px-3 py-1 rounded-full font-medium">Tailwind CSS</span>
                        <span className="bg-pink-100 text-pink-700 text-sm px-3 py-1 rounded-full font-medium">Google Gemini API</span>
                    </div>
                </div>

                <p className="text-gray-500 text-sm border-t border-gray-100 pt-4 text-center">
                    Yhteystiedot: etunimi.sukunimi@esimerkki.fi
                </p>
            </div>
        </main>
    );
}