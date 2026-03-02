import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Printer, Save, User, Barcode, CreditCard, Banknote } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { Product, Customer, InvoiceItem } from '../lib/utils';
import { useReactToPrint } from 'react-to-print';

export default function InvoiceCreator() {
  const { t, dir } = useLanguage();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState(14);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // UI States
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState(0);

  // Print Ref
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, unit_price: 0, subtotal: 0 }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Auto-fill price if product selected
    if (field === 'product_name') {
      const product = products.find(p => p.name === value);
      if (product) {
        item.unit_price = product.price;
        item.product_id = product.id;
      }
    }

    item.subtotal = item.quantity * item.unit_price;
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      const existingItemIndex = items.findIndex(i => i.product_id === product.id);
      if (existingItemIndex >= 0) {
        const newItems = [...items];
        newItems[existingItemIndex].quantity += 1;
        newItems[existingItemIndex].subtotal = newItems[existingItemIndex].quantity * newItems[existingItemIndex].unit_price;
        setItems(newItems);
        toast.success(`Increased quantity for ${product.name}`);
      } else {
        setItems([...items, { 
          product_id: product.id, 
          product_name: product.name, 
          quantity: 1, 
          unit_price: product.price, 
          subtotal: product.price 
        }]);
        toast.success(`Added ${product.name}`);
      }
      setBarcodeInput('');
    } else {
      toast.error('Product not found');
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handleSaveInvoice = async () => {
    if (!customerName && !selectedCustomer) {
      toast.error(t('enterName'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id,
          customer_name: selectedCustomer ? selectedCustomer.name : customerName,
          invoice_date: invoiceDate,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: total,
          status: 'delivered',
          payment_method: paymentMethod,
          amount_paid: amountPaid,
          change_due: amountPaid - total,
          items
        }),
      });

      if (res.ok) {
        toast.success(t('invoiceSaved'));
        // Reset form
        setItems([]);
        setCustomerName('');
        setSelectedCustomer(null);
        setShowPaymentModal(false);
      } else {
        toast.error(t('failedSaveInvoice'));
      }
    } catch (error) {
      toast.error(t('errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintThermal = useReactToPrint({
    contentRef: printRef,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">{t('createInvoiceTitle')}</h2>
          <p className="text-gray-500">{t('createInvoiceDesc')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrintThermal}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Printer size={20} />
            <span>{t('printThermal')}</span>
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-rose-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 font-medium"
            disabled={isSaving}
          >
            <Save size={20} />
            <span>{isSaving ? t('saving') : t('saveInvoice')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Date */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('customerName')}</label>
                <div className="relative">
                  <User className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    list="customers-list"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      const cust = customers.find(c => c.name === e.target.value);
                      setSelectedCustomer(cust || null);
                    }}
                    placeholder={t('enterCustomerName')}
                    className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none"
                  />
                  <datalist id="customers-list">
                    {customers.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoiceDate')}</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none"
                />
              </div>
            </div>

            {/* Barcode Scanner Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('scanBarcode')}</label>
              <form onSubmit={handleBarcodeScan} className="relative">
                <Barcode className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode here..."
                  className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none"
                  autoFocus
                />
              </form>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
            <table className="w-full text-left rtl:text-right">
              <thead className="bg-rose-50/50 text-gray-600 font-medium text-sm">
                <tr>
                  <th className="p-4 w-1/2">{t('itemName')}</th>
                  <th className="p-4 w-20">{t('quantity')}</th>
                  <th className="p-4 w-24">{t('unitPrice')}</th>
                  <th className="p-4 w-24">{t('subtotal')}</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50">
                {items.map((item, index) => (
                  <tr key={index} className="group hover:bg-rose-50/30">
                    <td className="p-2">
                      <input
                        type="text"
                        list="products-list"
                        value={item.product_name}
                        onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                        placeholder={t('selectItem')}
                        className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none bg-transparent"
                      />
                      <datalist id="products-list">
                        {products.map(p => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none bg-transparent"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none bg-transparent"
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      ${item.subtotal.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeItem(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={addItem}
              className="w-full py-3 flex items-center justify-center gap-2 text-rose-600 font-medium hover:bg-rose-50 transition-colors border-t border-rose-50"
            >
              <Plus size={18} />
              <span>{t('addItem')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 space-y-4">
            <h3 className="font-bold text-gray-900">{t('totalOrderValue')}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t('subtotal')}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>{t('taxRate')}</span>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 rounded border border-gray-200 text-right outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax Amount</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-end">
                <span className="font-bold text-gray-900 text-lg">{t('total')}</span>
                <span className="font-bold text-rose-600 text-2xl">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{t('paymentMethod')}</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'cash' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <Banknote size={24} className="mb-2" />
                  <span className="text-sm font-medium">{t('cash')}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('visa')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'visa' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <CreditCard size={24} className="mb-2" />
                  <span className="text-sm font-medium">{t('visa')}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'credit' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <User size={24} className="mb-2" />
                  <span className="text-sm font-medium">{t('credit')}</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('amountPaid')}</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-xl font-bold"
                />
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">{t('changeDue')}</span>
                <span className={`text-xl font-bold ${amountPaid - total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(amountPaid - total).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveInvoice}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium shadow-lg shadow-rose-200"
                >
                  {t('saveInvoice')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Thermal Print Template */}
      <div className="hidden">
        <div ref={printRef} className="p-4 w-[80mm] font-mono text-xs text-black">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold">Soft Rose</h1>
            <p>Sales Manager</p>
            <p>{new Date().toLocaleString()}</p>
          </div>
          <div className="border-b border-black mb-2"></div>
          <div className="mb-2">
            <p>Customer: {selectedCustomer ? selectedCustomer.name : customerName}</p>
            <p>Invoice #: {Date.now().toString().slice(-6)}</p>
          </div>
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left">Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{item.product_name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-black pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>Total:</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
