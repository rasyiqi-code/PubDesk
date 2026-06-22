// @ts-nocheck
import { Database } from "bun:sqlite";
import { join } from "path";
import { homedir } from "os";

// Menentukan lokasi database PubHub di sistem Linux
const dbPath = join(homedir(), ".local/share/PubHub/pubhub.db");
console.log(`==== Uji Konkurensi Database Bersama ====`);
console.log(`Lokasi Database: ${dbPath}\n`);

try {
  // Inisialisasi koneksi utama untuk setup WAL & busy_timeout
  const mainDb = new Database(dbPath);
  mainDb.run("PRAGMA journal_mode=WAL;");
  mainDb.run("PRAGMA busy_timeout = 5000;");
  mainDb.close();

  const NUM_WORKERS = 5;
  const WRITES_PER_WORKER = 20;

  console.log(`Menjalankan ${NUM_WORKERS} worker penulisan simultan...`);
  console.log(`Masing-masing worker melakukan ${WRITES_PER_WORKER} kali penulisan.\n`);

  const startTime = Date.now();
  const promises: Promise<void>[] = [];

  for (let i = 1; i <= NUM_WORKERS; i++) {
    promises.push((async (workerId: number) => {
      // Buka koneksi per-worker (mirip dengan multi-aplikasi tauri terpisah)
      const db = new Database(dbPath);
      db.run("PRAGMA journal_mode=WAL;");
      db.run("PRAGMA busy_timeout = 5000;");

      for (let j = 1; j <= WRITES_PER_WORKER; j++) {
        try {
          // Melakukan penulisan ke tabel activity_log
          db.run(
            "INSERT INTO activity_log (entity_type, entity_id, action, description, created_at) VALUES (?, ?, ?, ?, ?)",
            [
              "concurrency_test",
              workerId,
              "WRITE",
              `Worker ${workerId} menulis baris ke-${j}`,
              new Date().toISOString()
            ]
          );
          // Beri sedikit jeda acak untuk mensimulasikan jeda transaksi real
          await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
        } catch (err: any) {
          console.error(`❌ Worker ${workerId} Gagal menulis pada iterasi ${j}:`, err.message);
          db.close();
          throw err;
        }
      }
      db.close();
      console.log(`✓ Worker ${workerId} selesai tanpa hambatan.`);
    })(i));
  }

  await Promise.all(promises);
  const duration = Date.now() - startTime;

  console.log(`\n✅ Uji Konkurensi Berhasil!`);
  console.log(`Total penulisan sukses: ${NUM_WORKERS * WRITES_PER_WORKER} baris.`);
  console.log(`Durasi total: ${duration} ms.`);

} catch (err: any) {
  console.error(`\n❌ Uji Konkurensi Gagal:`, err.message);
  process.exit(1);
}
