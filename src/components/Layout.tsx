import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, Settings, Flower, Languages } from 'lucide-react';
import { cn } from '../lib/utils';
import { Toaster } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage, dir } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="flex h-screen bg-rose-50" dir={dir}>
      <Toaster position="top-right" richColors dir={dir} />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-l-0 border-rose-100 shadow-sm flex flex-col rtl:border-l rtl:border-r-0">
        <div className="p-6 flex items-center gap-3 border-b border-rose-100">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
            <Flower size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-rose-900 leading-none">{t('appTitle')}</h1>
            <span className="text-xs text-rose-500 font-medium">{t('appSubtitle')}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                  : "text-gray-600 hover:bg-rose-50 hover:text-rose-700"
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
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                  : "text-gray-600 hover:bg-rose-50 hover:text-rose-700"
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
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                  : "text-gray-600 hover:bg-rose-50 hover:text-rose-700"
              )
            }
          >
            <Package size={20} />
            <span className="font-medium">{t('inventory')}</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-rose-100 space-y-4">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <Languages size={20} />
            <span className="font-medium">{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          <div className="bg-rose-50 rounded-xl p-4">
            <p className="text-xs text-rose-600 font-medium mb-1">{t('systemStatus')}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">{t('online')}</span>
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
