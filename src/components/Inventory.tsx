import { useState, useEffect } from 'react';
import { Plus, Search, Upload, Edit, Trash2, AlertTriangle, Barcode } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export default function Inventory() {
  const { t, dir } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = currentProduct.id ? 'PUT' : 'POST';
      const url = currentProduct.id ? `/api/products/${currentProduct.id}` : '/api/products';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProduct),
      });

      if (res.ok) {
        toast.success(currentProduct.id ? t('productUpdated') : t('productAdded'));
        setIsModalOpen(false);
        fetchProducts();
      } else {
        toast.error(t('failedSaveProduct'));
      }
    } catch (error) {
      toast.error(t('failedSaveProduct'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeleteProduct'))) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('productDeleted'));
        fetchProducts();
      } else {
        toast.error(t('failedDeleteProduct'));
      }
    } catch (error) {
      toast.error(t('failedDeleteProduct'));
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      let successCount = 0;
      let failCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [name, price, stock, min_stock, barcode] = line.split(',');
        
        if (name && price) {
          try {
            await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                name, 
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                min_stock: parseInt(min_stock) || 10,
                barcode: barcode || ''
              }),
            });
            successCount++;
          } catch (err) {
            failCount++;
          }
        }
      }
      
      toast.success(t('importComplete').replace('{success}', successCount.toString()).replace('{fail}', failCount.toString()));
      fetchProducts();
    };
    reader.readAsText(file);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">{t('inventoryTitle')}</h2>
          <p className="text-gray-500">{t('inventoryDesc')}</p>
        </div>
        <div className="flex gap-3">
          <label className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload size={20} />
            <span>{t('importCsv')}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          </label>
          <button
            onClick={() => {
              setCurrentProduct({ stock: 0, min_stock: 10 });
              setIsModalOpen(true);
            }}
            className="bg-rose-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
          >
            <Plus size={20} />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('searchProducts')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-rose-50/50 text-gray-600 font-medium">
              <tr>
                <th className="p-4">{t('productName')}</th>
                <th className="p-4">{t('unitPrice')}</th>
                <th className="p-4">{t('stock')}</th>
                <th className="p-4">{t('barcode')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">{t('loadingInventory')}</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">{t('noProducts')}</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{product.name}</td>
                    <td className="p-4 text-gray-600">${product.price.toFixed(2)}</td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 ${product.stock <= product.min_stock ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                        {product.stock}
                        {product.stock <= product.min_stock && <AlertTriangle size={16} />}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-xs">{product.barcode || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {currentProduct.id ? t('editProduct') : t('addNewProduct')}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('productName')}</label>
                <input
                  type="text"
                  required
                  value={currentProduct.name || ''}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('unitPrice')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={currentProduct.price || ''}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('stock')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={currentProduct.stock || 0}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('minStock')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={currentProduct.min_stock || 10}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, min_stock: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('barcode')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={currentProduct.barcode || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, barcode: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 outline-none pl-8"
                    />
                    <Barcode className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium shadow-lg shadow-rose-200"
                >
                  {t('saveProduct')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
