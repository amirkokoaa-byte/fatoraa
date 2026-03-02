import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, Settings, Flower, Languages, LogOut, Home, Users, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { Toaster } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage, dir } = useLanguage();
  const { logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="flex h-screen bg-rose-50 dark:bg-gray-900 transition-colors duration-300" dir={dir}>
      <Toaster position="top-right" richColors dir={dir} theme={isDark ? 'dark' : 'light'} />
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-l-0 border-rose-100 dark:border-gray-700 shadow-sm flex flex-col rtl:border-l rtl:border-r-0 transition-colors duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-rose-100 dark:border-gray-700">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Flower size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-rose-900 dark:text-rose-100 leading-none">{t('appTitle')}</h1>
            <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">{t('appSubtitle')}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none"
                  : "text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 dark:hover:text-rose-300"
              )
            }
          >
            <Home size={20} />
            <span className="font-medium">{t('dashboard')}</span>
          </NavLink>

          <NavLink
            to="/create"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none"
                  : "text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 dark:hover:text-rose-300"
              )
            }
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">{t('newInvoice')}</span>
          </NavLink>

          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none"
                  : "text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 dark:hover:text-rose-300"
              )
            }
          >
            <FileText size={20} />
            <span className="font-medium">{t('orderHistory')}</span>
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none"
                  : "text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 dark:hover:text-rose-300"
              )
            }
          >
            <Package size={20} />
            <span className="font-medium">{t('inventory')}</span>
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none"
                  : "text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 dark:hover:text-rose-300"
              )
            }
          >
            <Users size={20} />
            <span className="font-medium">{t('customers')}</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-rose-100 dark:border-gray-700 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={toggleLanguage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 dark:hover:text-rose-300 transition-colors border border-gray-200 dark:border-gray-600"
            >
              <Languages size={18} />
              <span className="font-medium text-sm">{language === 'en' ? 'عربي' : 'En'}</span>
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-gray-700 hover:text-rose-700 dark:hover:text-rose-300 transition-colors border border-gray-200 dark:border-gray-600"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('logout')}</span>
          </button>

          <div className="bg-rose-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">{t('systemStatus')}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('online')}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
