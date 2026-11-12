'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Tervetuloa takaisin, ${email}!`);
    router.push('/');
  };

  return (
    <main className="w-full flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-pink-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Kirjaudu sisään ✂️</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sähköposti</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="nimi@esimerkki.fi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salasana</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="bg-pink-600 text-white p-3 rounded-lg font-medium hover:bg-pink-700 transition mt-2 shadow-sm"
          >
            Kirjaudu sisään
          </button>
        </form>
      </div>
    </main>
  );
}