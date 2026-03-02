import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye, Filter } from 'lucide-react';
import { Invoice } from '../lib/utils';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export default function InvoiceList() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    setLoading(true);
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeleteInvoice'))) return;
    
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      toast.success(t('invoiceDeleted'));
      loadInvoices();
    } catch (error) {
      console.error('Failed to delete', error);
      toast.error(t('failedDeleteInvoice'));
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const invoice = await res.json();
      
      const updatedInvoice = { ...invoice, status: newStatus };
      
      await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedInvoice)
      });
      
      toast.success(t('statusUpdated'));
      loadInvoices();
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error(t('failedUpdateStatus'));
    }
  };

  const handlePrint = async (id: number) => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const invoice = await res.json();
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(225, 29, 72);
      doc.text('Soft Rose', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('Sales Invoice', 14, 28);

      // Info
      doc.setFontSize(10);
      doc.text(`Customer: ${invoice.customer_name}`, 14, 40);
      doc.text(`Date: ${invoice.invoice_date}`, 14, 46);
      doc.text(`Invoice #: ${invoice.id}`, 160, 40);

      // Table
      autoTable(doc, {
        startY: 55,
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: invoice.items.map((item: any) => [
          item.product_name,
          item.quantity,
          item.unit_price.toFixed(2),
          item.subtotal.toFixed(2)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72] }
      });

      // Totals
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, 140, finalY);
      doc.text(`Tax (${invoice.tax_rate}%): ${invoice.tax_amount.toFixed(2)}`, 140, finalY + 6);
      doc.setFontSize(12);
      doc.setTextColor(225, 29, 72);
      doc.text(`Total: ${invoice.total_amount.toFixed(2)}`, 140, finalY + 14);

      doc.save(`invoice_${invoice.id}.pdf`);
    } catch (error) {
      console.error('Failed to print', error);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toString().includes(searchTerm) ||
    inv.invoice_date.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">{t('orderHistoryTitle')}</h2>
          <p className="text-gray-500">{t('orderHistoryDesc')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-rose-100 flex gap-4 bg-rose-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            <Filter size={18} />
            <span>{t('filter')}</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('invoiceNum')}</th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('customer')}</th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total')}</th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">{t('loading')}</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">{t('noInvoices')}</td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{invoice.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-rose-600">
                      {invoice.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-none focus:ring-0 cursor-pointer ${
                          invoice.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'partial_return' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        <option value="delivered">{t('delivered')}</option>
                        <option value="partial_return">{t('partialReturn')}</option>
                        <option value="full_return">{t('fullReturn')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right rtl:text-left text-sm font-medium">
                      <div className="flex justify-end rtl:justify-start gap-2">
                        <button 
                          onClick={() => handlePrint(invoice.id)}
                          className="text-gray-400 hover:text-rose-600 transition-colors" title="Print PDF"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(invoice.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"
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
    </div>
  );
}
