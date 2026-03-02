import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, FileText, AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    salesToday: 0,
    invoiceCount: 0,
    topProducts: [],
    returnRate: 0
  });

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const COLORS = ['#e11d48', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 font-serif">{t('dashboard')}</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('salesToday')}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.salesToday.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('invoiceCount')}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.invoiceCount}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <RefreshCcw size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('returnRate')}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.returnRate.toFixed(1)}%</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('lowStock')}</p>
              <h3 className="text-2xl font-bold text-gray-900">3</h3> {/* Placeholder for now */}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 h-80">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('topSelling')}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topProducts}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="product_name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="qty" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 h-80 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-gray-900 mb-4 w-full text-left">{t('salesToday')} vs Target</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Sales', value: stats.salesToday },
                  { name: 'Remaining', value: 5000 - stats.salesToday > 0 ? 5000 - stats.salesToday : 0 }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#e11d48" />
                <Cell fill="#fecdd3" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
