import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-pink-50 px-8 py-4 shadow-sm border-b border-gray-100 flex justify-between items-center">
      <span className="font-bold text-lg text-pink-600">Sivuntekijä ✂️</span>
      <div className="flex gap-6">
        <Link href="/" className="text-gray-600 hover:text-pink-600 font-medium transition">
          Etusivu
        </Link>
        <Link href="/about" className="text-gray-600 hover:text-pink-600 font-medium transition">
          About us
        </Link>
      </div>
    </nav>
  );
}