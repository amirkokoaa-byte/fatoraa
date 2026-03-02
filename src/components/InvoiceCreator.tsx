import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Printer, RefreshCw, Search } from 'lucide-react';
import { Product, InvoiceItem } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export default function InvoiceCreator() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Invoice State
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState(14);
  const [items, setItems] = useState<InvoiceItem[]>([
    { product_name: '', quantity: 1, unit_price: 0, subtotal: 0 }
  ]);

  // Fetch products for autocomplete
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Failed to load products', err));
  }, []);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    // Auto-calculate subtotal
    if (field === 'quantity' || field === 'unit_price') {
      item.subtotal = Number(item.quantity) * Number(item.unit_price);
    }

    // If product name changes, try to find price
    if (field === 'product_name') {
      const product = products.find(p => p.name === value);
      if (product) {
        item.unit_price = product.price;
        item.subtotal = Number(item.quantity) * product.price;
      }
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, unit_price: 0, subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!customerName) {
      toast.error(t('enterName'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer_name: customerName,
        invoice_date: invoiceDate,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'delivered',
        items
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(t('invoiceSaved'));
        // Reset form or redirect
        setCustomerName('');
        setItems([{ product_name: '', quantity: 1, unit_price: 0, subtotal: 0 }]);
        navigate('/invoices');
      } else {
        toast.error(t('failedSaveInvoice'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(225, 29, 72); // Rose 600
    doc.text('Soft Rose', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Sales Invoice', 14, 28);

    // Info
    doc.setFontSize(10);
    doc.text(`Customer: ${customerName}`, 14, 40);
    doc.text(`Date: ${invoiceDate}`, 14, 46);
    doc.text(`Invoice #: NEW`, 160, 40);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: items.map(item => [
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
    doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`Tax (${taxRate}%): ${taxAmount.toFixed(2)}`, 140, finalY + 6);
    doc.setFontSize(12);
    doc.setTextColor(225, 29, 72);
    doc.text(`Total: ${totalAmount.toFixed(2)}`, 140, finalY + 14);

    doc.save(`invoice_${customerName}_${invoiceDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">{t('createInvoiceTitle')}</h2>
          <p className="text-gray-500">{t('createInvoiceDesc')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer size={18} />
            <span>{t('printPdf')}</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md shadow-rose-200 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            <span>{saving ? t('saving') : t('saveInvoice')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6">
        {/* Header Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('customerName')}</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
              placeholder={t('enterCustomerName')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoiceDate')}</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
            />
          </div>
          <div className="bg-rose-50 rounded-xl p-4 flex flex-col justify-center items-end rtl:items-start">
            <span className="text-sm text-rose-600 font-medium">{t('totalOrderValue')}</span>
            <span className="text-3xl font-bold text-rose-900">{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="border rounded-xl overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">{t('itemName')}</th>
                <th className="px-4 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">{t('quantity')}</th>
                <th className="px-4 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">{t('unitPrice')}</th>
                <th className="px-4 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">{t('subtotal')}</th>
                <th className="px-4 py-3 w-[10%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={index} className="group hover:bg-rose-50/30 transition-colors">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      list="products-list"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-gray-900 placeholder-gray-400"
                      placeholder={t('selectItem')}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-700"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-700"
                    />
                  </td>
                  <td className="px-4 py-2 text-gray-900 font-medium">
                    {item.subtotal.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="products-list">
            {products.map(p => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
        </div>

        <button
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={20} />
          {t('addItem')}
        </button>

        {/* Footer Summary */}
        <div className="mt-8 flex justify-end rtl:justify-start">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>{t('subtotal')}</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span className="flex items-center gap-2">
                {t('taxRate')}
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded border border-gray-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-none"
                />
              </span>
              <span>{taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">{t('total')}</span>
              <span className="text-xl font-bold text-rose-600">{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
