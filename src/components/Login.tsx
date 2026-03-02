import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Flower, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(pin)) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-6">
          <Flower size={40} />
        </div>
        <h1 className="text-3xl font-bold text-rose-900 font-serif mb-2">{t('appTitle')}</h1>
        <p className="text-gray-500 mb-8">{t('appSubtitle')}</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('enterPin')}</label>
            <div className="relative">
              <Lock className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                className={`w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3 rounded-xl border ${
                  error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-rose-500 focus:ring-rose-200'
                } focus:ring-2 outline-none text-center text-2xl tracking-widest`}
                placeholder="••••"
                maxLength={4}
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{t('invalidPin')}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
          >
            {t('login')}
          </button>
        </form>
        
        <p className="mt-6 text-xs text-gray-400">Default PIN: 1234</p>
      </div>
    </div>
  );
}
