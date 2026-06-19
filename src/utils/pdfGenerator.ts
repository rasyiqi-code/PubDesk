import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Membuat data biner PDF dari elemen pratinjau invoice dengan merekonstruksinya secara off-screen.
 * Ini memastikan rendering bebas dari distorsi skala CSS transform.
 * 
 * @param elementId ID dari elemen DOM pratinjau invoice yang akan dikloning.
 * @returns Promise berisi Uint8Array dari file PDF yang dihasilkan.
 */
export async function generateInvoicePDFBytes(elementId: string): Promise<Uint8Array> {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    throw new Error(`Elemen pratinjau dengan ID "${elementId}" tidak ditemukan di DOM.`);
  }

  // Buat container off-screen
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-9999px';
  container.style.width = '595px';
  container.style.height = '842px';
  container.style.overflow = 'hidden';
  container.style.background = '#ffffff';
  document.body.appendChild(container);

  try {
    // Kloning elemen asli beserta isinya
    const clonedElement = originalElement.cloneNode(true) as HTMLDivElement;

    // Bersihkan style transform dan pemosisian absolut agar ukurannya kembali normal (1:1)
    clonedElement.style.transform = 'none';
    clonedElement.style.top = '0';
    clonedElement.style.left = '0';
    clonedElement.style.position = 'static';
    clonedElement.style.margin = '0';
    clonedElement.style.boxShadow = 'none';
    clonedElement.style.borderRadius = '0';

    container.appendChild(clonedElement);

    // Tunggu sesaat agar font dan resource di-render penuh
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Ambil tangkapan layar elemen dengan resolusi tinggi (scale: 2.5)
    const canvas = await html2canvas(clonedElement, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Inisialisasi dokumen PDF berukuran A4 (potret, pt)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    // Tempelkan gambar ke dokumen PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, 595, 842);

    // Kembalikan ArrayBuffer sebagai Uint8Array
    const arrayBuffer = pdf.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  } finally {
    // Bersihkan container off-screen setelah selesai
    document.body.removeChild(container);
  }
}
