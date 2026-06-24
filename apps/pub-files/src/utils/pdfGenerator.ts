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

  // Pastikan font Google sudah termuat di dokumen utama sebelum kloning
  if (document.fonts) {
    await document.fonts.ready;
  }

  try {
    // Ambil tangkapan layar menggunakan html2canvas dengan memodifikasi kloningannya lewat callback onclone
    const canvas = await html2canvas(originalElement, {
      scale: 2.5,
      useCORS: true,
      allowTaint: false,
      logging: true,
      backgroundColor: '#ffffff',
      onclone: async (clonedDoc: Document) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // 1. Reset transform dan visual zoom di kloningan agar berskala A4 1:1 penuh
          clonedElement.style.transform = 'none';
          clonedElement.style.transformOrigin = '50% 50%';
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.borderRadius = '0';
          clonedElement.style.position = 'static';
          clonedElement.style.margin = '0';

          // 2. Hapus referensi filter SVG yang mengandung feDropShadow dari elemen grafis
          // agar shadow tidak merusak graphics pipeline WebKit (Tauri/Linux).
          // Penting: jangan hapus <feDropShadow> itu sendiri karena filter kosong
          // menyebabkan browser skip rendering grup <g> (header/footer jadi hilang).
          const dropShadowSelectors = [
            '[filter*="drop-shadow"]',
          ];
          clonedElement.querySelectorAll(dropShadowSelectors.join(',')).forEach((el) => {
            el.removeAttribute('filter');
          });
          // Hapus juga defs filter yang sudah tidak dipakai agar html2canvas tidak bingung
          clonedElement.querySelectorAll('defs filter[id*="drop-shadow"]').forEach((el) => {
            el.parentNode?.removeChild(el);
          });

          // 3. Deteksi dan hilangkan background inline SVG pattern pada watermark stempel
          // karena html2canvas di WebKit sering crash saat me-render raw inline SVG di background CSS
          const allDivs = clonedElement.querySelectorAll('div');
          allDivs.forEach((div) => {
            if (div.style.backgroundImage && div.style.backgroundImage.includes('data:image/svg+xml')) {
              div.style.backgroundImage = 'none';
            }
          });
        }

        // 4. Pastikan font Google termuat di dokumen kloning agar rendering PDF sesuai preview
        // html2canvas mengkloning <link> dari <head> dokumen asli, tetapi font mungkin belum siap
        const fontsUrl = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Playball&family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap';
        if (!clonedDoc.querySelector(`link[href="${fontsUrl}"]`)) {
          const link = clonedDoc.createElement('link');
          link.rel = 'stylesheet';
          link.href = fontsUrl;
          clonedDoc.head.appendChild(link);
        }
        if (clonedDoc.fonts) {
          await clonedDoc.fonts.ready;
        }
      }
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
  } catch (err) {
    console.error('[PDF Gen] Gagal memproses html2canvas:', err);
    throw err;
  }
}
