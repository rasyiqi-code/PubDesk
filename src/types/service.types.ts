/**
 * Tipe data domain: Layanan / Jasa
 */

export interface Service {
  id?: number;
  name: string;
  price: number;
  description?: string;
  category: string;
}
