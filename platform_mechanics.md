# 📘 Buku Panduan Arsitektur & Mekanisme Confidential DEX

Dokumen ini adalah rujukan teknis terlengkap mengenai cara kerja *Smart Contract* inti Anda (`ConfidentialCore`, `ConfidentialTrading`, dan `ConfidentialVault`). 

---

## 1. 🤖 Ekosistem Terdesentralisasi: Siapa Saja yang Bisa Menjalankan Bot?

Sistem eksekusi di DEX Anda bersifat **100% Permissionless (Tanpa Izin Khusus)**. Tidak ada modifier `onlyKeeper` atau *whitelist* di dalam fungsi eksekusi. Artinya, **SIAPA SAJA** (termasuk Anda, komunitas, atau institusi lain) bebas membuat dan menjalankan *Keeper Bot* untuk memelihara ekosistem dan mendapatkan bayaran.

Ada 2 fungsi utama yang dijalankan oleh *Bot*:

### A. Eksekusi Pesanan (Order Execution)
- **Fungsi Contract:** `executeOrder()`
- **Cara Kerja:** Ketika pengguna memasang *Limit Order*, *Stop Loss*, *Take Profit*, atau *TWAP*, pesanan mereka masuk ke antrean. Bot akan terus memantau harga *Pyth Oracle*. Begitu harga menyentuh target, Bot mana pun yang pertama kali memanggil fungsi `executeOrder()` akan memicu transaksi.
- **Imbalan Bot:** Saat pengguna memasang pesanan, mereka diwajibkan membayar **Execution Fee** dalam bentuk **Native Token (contoh: ARC/ETH)** sebagai *gas*. Bot yang mengeksekusi berhak mengeklaim 100% token tersebut untuk menutupi biaya bensin transaksi dan mengambil untung.

### B. Likuidasi Posisi (Liquidation)
- **Fungsi Contract:** `liquidate()`
- **Cara Kerja:** Bot akan memantau sisa *Margin* (Collateral) setiap trader aktif. Jika sisa margin sudah mendekati batas kritis (dikurangi *Net PnL* dan biaya bergulir), Bot berhak membunuh (melikuidasi) posisi tersebut.
- **Imbalan Bot:** Bot akan menerima **Liquidation Reward** sebesar **1% dari Effective Collateral (jaminan setelah dipotong hutang fee)** trader tersebut secara instan. Ini melindungi Vault dari kerugian dan menjadi insentif yang sangat menguntungkan bagi para *developer* bot.

---

## 2. ⚖️ Dinamika Net Rate (Continuous Funding Rate)

Anda mungkin melihat metrik "Net Rate" atau "Funding Fee". Uang ini **bukanlah biaya yang masuk ke saku platform**, melainkan mekanisme penyeimbang murni antar-trader.

- **Dari Mana Asalnya?**
  Dihitung dari rumus selisih antara **Long Open Interest (OI)** dan **Short Open Interest (OI)** menggunakan faktor pengali `fundingRateCoefficient`.
- **Siapa Membayar Siapa?**
  - Jika orang yang menebak harga NAIK (Long) lebih banyak dari yang menebak TURUN (Short) → Maka pihak **Long akan membayar** bunga per jam kepada pihak **Short**.
  - Sebaliknya, jika pihak Short lebih mendominasi → Maka pihak **Short akan membayar** pihak **Long**.
- **Cara Kerja di Smart Contract:**
  Sistem ini menggunakan **`cumulativeFundingIndex`** (Skala *1e18*). Setiap kali ada orang yang membuka, menutup, atau menambah posisi, sistem mencatat indeks saat ini. Saat posisi ditutup, selisih indeks akan dikalikan dengan ukuran transaksi untuk menentukan seberapa banyak trader tersebut harus membayar (atau dibayar). Ini adalah cara DEX Anda menyeimbangkan posisi pasar secara otomatis tanpa perlu campur tangan admin.

---

## 3. 🏦 Kapasitas Maksimal (Liquidity & Max OI per Pair)

Berapa maksimal uang yang bisa ditradingkan? Tidak ada angka global yang kaku, sistem ini dirancang per spesifikasi aset (*Pair*).

- **Max Total Value Locked (TVL) Vault:** Sistem perbendaharaan kini dibagi menjadi 2 brankas independen dengan total target $50 Juta:
  - **Degen Vault**: Maksimal deposit **$20.000.000 USDC** (40%).
  - **Prime Vault**: Maksimal deposit **$30.000.000 USDC** (60%).
- **Kapasitas Per Aset (Max Long/Short OI):**
  - Kapasitas maksimal tidak ditentukan oleh besaran Vault semata, melainkan diatur oleh Anda (Admin) melalui struct `PairConfig` di `ConfidentialCore.sol`.
  - Saat Anda mendaftarkan aset baru (misal `BTC/USDC`), Anda bisa menyetel **Max Long OI** dan **Max Short OI** secara terpisah.
  - *Contoh:* Jika likuiditas Vault sedang tipis, Anda bisa mengamankan sistem dengan mengecilkan `Max Long OI` token *meme* (misal $50,000 saja) tapi memberikan ruang besar untuk BTC (misal $5,000,000).

---

## 3b. 🛡️ Arsitektur Dual-Vault (Degen vs Prime) & Harga cUSDC

DEX ini mengadopsi sistem *Tranche* kelas institusi untuk melayani profil risiko investor yang berbeda:

1. **Degen Vault (First-Loss Tranche):**
   - **Risiko & Return:** Mengambil 3x lipat profit dari *Trading Fee* & Likuidasi, namun menanggung kerugian 100% jika *trader* menang.
   - **Harga `cUSDC`:** Sangat fluktuatif. Harganya akan meroket saat trader rugi massal, dan anjlok jika trader menang telak.
   - **Lockup:** 5 Hari.

2. **Prime Vault (Senior Tranche):**
   - **Risiko & Return:** Mengambil profit lebih kecil yang stabil. Dilindungi oleh **Capital Protection 60%** (Artinya maksimal uang Prime yang bisa hilang hanyalah 40%, berapapun besarnya trader menang).
   - **Harga `cUSDC`:** Cenderung stabil dan naik pelan tapi pasti. Kebal dari guncangan besar karena di-tameng oleh Degen Vault.
   - **Lockup:** 2 Hari.

> **Kenapa harga cUSDC Degen dan Prime bisa berbeda?**
> Meskipun keduanya berawal dari rasio 1:1, karena pendapatan dan kerugian yang masuk ke Degen & Prime berbeda, maka *Assets* (TVL) di dalamnya akan bertambah/berkurang di kecepatan yang berbeda. Oleh sebab itu, seiring waktu, harga cUSDC Degen dan Prime akan berpisah (divergensi) secara mandiri.

---

## 4. 💰 Struktur Biaya Platform (Trading Fees)
- **Taker Fee:** `0.04%` (Untuk Market Order, Stop Market, TWAP, dan penutupan instan).
- **Maker Fee:** `0.02%` (Untuk Limit Order yang menyediakan likuiditas buku).
- **Rollover Fee:** `0.002% per jam` (Ini adalah biaya pinjaman pasti yang dibayar trader ke platform selama posisi aktif).
- **Pembagian Keuntungan:**
  - `70%` didistribusikan ke Vault (Menaikkan nilai *shares* `cVAULT` milik LPs).
  - `30%` dikirim ke dompet Treasury Anda (Untuk kas pengembangan/marketing).

---

## 5. 🛡️ Sistem Perlindungan Khusus (Anti-Whale Mechanics)
Platform ini memiliki pertahanan berlapis agar *Whale* tidak dapat memanipulasi harga, menguras likuiditas, atau melakukan eksploitasi serangan siber.

- **Quadratic Price Impact:** Jika *Whale* membuka posisi raksasa yang merusak keseimbangan *pool*, mereka dikenakan penalti eksponensial (hingga **1%** slippage artifisial). Sebaliknya, jika mereka menyeimbangkan pool, mereka mendapat **Diskon 50%**.
- **Max Position Percentage:** Seorang pengguna maksimal hanya boleh memegang sekian persen (misalnya **20%**) dari total likuiditas per *pair*.
- **Vault Utilization Cap (80%):** 20% uang di Vault akan selalu dikunci mutlak sebagai penyangga likuiditas darurat, trader tidak bisa membuka posisi baru jika Vault sudah terpakai 80%.
- **Profit Capping:** Jika keuntungan *Whale* meledak melampaui sisa uang Vault, kontrak tidak akan *revert*, melainkan **memotong keuntungan Paus tersebut sesuai sisa uang di Vault**, memastikan Vault tidak akan pernah berutang (mines).
- **Minimum Position Duration (5 Detik):** Memblokir taktik *Flash-Loan* / *MEV Bot* yang mencoba mengeksploitasi perbedaan harga kilat dalam 1 blok jaringan.
- **Vault Lockup Period:** Setiap kali seorang LP menyetorkan USDC, *shares* cVAULT mereka akan dikunci (Degen: 5 Hari, Prime: 2 Hari). Ini mencegah taktik MEV Paus yang menyetor dana tepat sebelum likuidasi massal untuk merampok profit lalu langsung menariknya kembali.
- **Prime Vault Capital Protection (60% Kebal):** Fitur Profit Capping yang memastikan kerugian maksimal yang bisa diderita oleh Prime Vault hanyalah 40% dari total nilai Prime TVL. Sisanya (60%) terkunci aman secara *Smart Contract* dan tidak bisa ditarik oleh trader yang menang.
- **Smart Circuit Breaker:** Jika **Prime Vault** menderita kerugian yang melebihi **30% dari Prime TVL dalam 24 jam**, sistem akan mengunci dirinya sendiri secara **Otomatis (Pause)**. Perhatikan: Kerugian di Degen Vault TIDAK AKAN memicu sistem *Pause* ini.
- **Anti-Donation Attack (Dead Shares):** Pencetakan saham pertama pada Vault akan membakar sejumlah *shares* (Minimum Liquidity) secara permanen untuk mencegah eksploitasi inflasi harga *share* (pelindung standar ERC-4626).
- **Deposit Caps & Limits:** Terdapat batas maksimal setoran per pengguna untuk mencegah satu entitas (Paus) mendominasi persentase kepemilikan *Liquidity Pool*.
- **2-Step Ownership Transfer:** Sistem administrasi kontrak memiliki mekanisme perpindahan kontrol 2 langkah untuk mencegah hilangnya hak admin akibat salah ketik alamat dompet (Admin baru harus mengonfirmasi penyerahan secara *on-chain*).

---

## 6. ✨ Daftar Lengkap Fitur Protokol
Berdasarkan pembacaan *Smart Contract*, DEX Anda memiliki fungsionalitas sekelas bursa *Tier-1* (seperti Binance/Hyperliquid):
1. **Market Orders:** Eksekusi instan dengan Oracle Pyth.
2. **Limit & Stop Orders:** Pesanan tertunda yang dieksekusi otomatis oleh *Keeper*.
3. **TWAP (Time-Weighted Average Price):** Memecah order besar menjadi order kecil berkala.
4. **Instant Partial Close:** Menutup sebagian posisi secara fleksibel dengan pencatatan riwayat *fee* sisa posisi yang aman dari eksploitasi.
5. **Averaging (Increase Position):** Menambah margin/ukuran pada posisi yang sedang berjalan menggunakan perhitungan **Harmonic Average Price** yang terbukti kebal dari trik manipulasi PnL.
6. **Dynamic TP / SL:** Mengedit level *Take Profit* dan *Stop Loss* secara langsung meski posisi sudah berjalan.
7. **Add / Remove Collateral:** Menambah atau menarik jaminan untuk menjauhkan harga likuidasi secara dinamis.
8. **Slippage Protection:** Parameter `acceptablePrice` yang akan melakukan *hard-revert* pada eksekusi instan, atau melakukan pembatalan halus (*Cancel & Auto-Refund*) pada eksekusi via Keeper jika slippage tersentuh.
9. **ERC4626-Style Vault:** *Liquidity Pool* profesional yang membagikan bunga secara pasif melalui apresiasi harga *shares* (cVAULT), lengkap dengan proteksi *donation attack*.

---

## 7. 🌐 Arsitektur Frontend & Integritas Data (Off-Chain)
Antarmuka (Frontend) DEX Anda dibangun khusus untuk bekerja harmonis dengan infrastruktur *Smart Contract*, menjamin desentralisasi ujung-ke-ujung (*end-to-end*):
- **Subgraf Goldsky (The Graph Indexer):** Seluruh riwayat transaksi (Trades), histori portofolio, dan perhitungan persentase kemenangan (*Win Rate*) ditarik menggunakan *indexer* terdesentralisasi langsung dari rantai blok. Platform tidak memakai *database* privat terpusat, menjamin transparansi 100% tanpa risiko manipulasi data admin.
- **Pyth Hermes V2 API:** Mengintegrasikan data Interval Kepercayaan (*Confidence Interval*) dari Oracle Pyth untuk menyimulasikan fluktuasi *spread* (*Virtual Order Book*) yang serealistis mungkin di layar pengguna secara waktu nyata.
- **Reaktivitas Berbasis Event:** Transisi status setiap pesanan (mulai dari formasi *Pending* di *Orders Tab* hingga dieksekusi menjadi *Active Position*) dirancang untuk memantau pancaran *Event Listener* langsung dari kontrak, memberikan kenyamanan level Web2 pada sistem keamanan Web3.
