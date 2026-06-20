import { InvoiceItem } from '../types/invoice.types';

export const getIndonesianDate = () => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const evaluateItemFormula = (formulaStr: string, item: InvoiceItem): any => {
  try {
    let processed = formulaStr;
    const tokenRegex = /\{([^}]+)\}/g;
    let match;
    let containsString = false;
    const keys: string[] = [];
    while ((match = tokenRegex.exec(formulaStr)) !== null) {
      keys.push(match[1]);
    }
    keys.forEach(key => {
      let val = (item as any)[key];
      if (val === undefined || val === null) val = 0;
      if (typeof val === 'string' && isNaN(Number(val))) containsString = true;
      processed = processed.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    });
    const mathOperators = /[\+\-\*\/\(\)]/;
    if (containsString || !mathOperators.test(processed)) return processed;
    const safeMathExpr = processed.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '');
    const result = new Function(`return (${safeMathExpr});`)();
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch (e) {
    console.error('Gagal mengevaluasi formula:', formulaStr, e);
    return 0;
  }
};

export const getInvoiceMetadata = (invoice: any) => {
  try {
    if (invoice.file_path) return JSON.parse(invoice.file_path);
  } catch (e) {
    console.error('Gagal memuat metadata invoice:', e);
  }
  return {
    invoiceNo: '-', invoiceDate: '-', invoiceHal: '-',
    invoiceLampiran: '-', paymentStatus: 'BERMASALAH',
    customerName: 'Umum', customerWa: '-', customerAddress: '',
    spesifikasiFasilitas: ''
  };
};
