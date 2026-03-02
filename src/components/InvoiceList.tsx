import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Eye, RefreshCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, InvoiceItem } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';

export default function InvoiceList() {
  const { t, dir } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnQuantity, setReturnQuantity] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      setSelectedInvoice(data);
      setReturnModalOpen(true);
    } catch (error) {
      toast.error('Failed to load invoice details');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeleteInvoice'))) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('invoiceDeleted'));
        setInvoices(invoices.filter((i) => i.id !== id));
      } else {
        toast.error(t('failedDeleteInvoice'));
      }
    } catch (error) {
      toast.error(t('failedDeleteInvoice'));
    }
  };

  const handleReturnItem = async (itemId: number, quantity: number) => {
    if (!selectedInvoice) return;
    
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      });

      if (res.ok) {
        toast.success(t('returned'));
        fetchInvoiceDetails(selectedInvoice.id); // Refresh details
        fetchInvoices(); // Refresh list
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to return item');
      }
    } catch (error) {
      toast.error('Error returning item');
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      invoice.id.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">{t('orderHistoryTitle')}</h2>
          <p className="text-gray-500">{t('orderHistoryDesc')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-rose-50/50 text-gray-600 font-medium">
              <tr>
                <th className="p-4">{t('invoiceNum')}</th>
                <th className="p-4">{t('date')}</th>
                <th className="p-4">{t('customer')}</th>
                <th className="p-4">{t('total')}</th>
                <th className="p-4">{t('status')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">{t('loading')}</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">{t('noInvoices')}</td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="p-4 font-mono text-rose-600">#{invoice.id.toString().padStart(6, '0')}</td>
                    <td className="p-4 text-gray-600">{format(new Date(invoice.invoice_date), 'MMM d, yyyy')}</td>
                    <td className="p-4 font-medium text-gray-900">{invoice.customer_name}</td>
                    <td className="p-4 font-bold text-gray-900">${invoice.total_amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'partial_return'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {t(invoice.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => fetchInvoiceDetails(invoice.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
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

      {/* Details/Return Modal */}
      {returnModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Invoice #{selectedInvoice.id}</h3>
                <p className="text-sm text-gray-500">{selectedInvoice.customer_name} - {selectedInvoice.invoice_date}</p>
              </div>
              <button onClick={() => setReturnModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                  <tr>
                    <th className="p-3">{t('itemName')}</th>
                    <th className="p-3">{t('quantity')}</th>
                    <th className="p-3">{t('unitPrice')}</th>
                    <th className="p-3">{t('returned')}</th>
                    <th className="p-3 text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedInvoice.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-medium">{item.product_name}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">${item.unit_price.toFixed(2)}</td>
                      <td className="p-3 text-red-600 font-medium">{item.returned_quantity || 0}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-end">
                          <input 
                            type="number" 
                            min="1" 
                            max={item.quantity - (item.returned_quantity || 0)}
                            className="w-16 px-2 py-1 border rounded text-sm"
                            placeholder="Qty"
                            onChange={(e) => setReturnQuantity({ ...returnQuantity, [item.id!]: parseInt(e.target.value) })}
                          />
                          <button
                            onClick={() => {
                              const qty = returnQuantity[item.id!] || 0;
                              if (qty > 0) handleReturnItem(item.id!, qty);
                            }}
                            disabled={(item.quantity - (item.returned_quantity || 0)) <= 0}
                            className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('returnItem')}
                          >
                            <RefreshCcw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
                 <div className="flex justify-between text-sm">
                    <span>{t('subtotal')}</span>
                    <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span>{t('taxRate')}</span>
                    <span>{selectedInvoice.tax_rate}%</span>
                 </div>
                 <div className="flex justify-between font-bold text-lg">
                    <span>{t('total')}</span>
                    <span>${selectedInvoice.total_amount.toFixed(2)}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
