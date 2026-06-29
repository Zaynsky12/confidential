# 📘 Panduan Arsitektur & Keamanan Confidential DEX

**Confidential DEX** adalah bursa derivatif terdesentralisasi (*Decentralized Perpetual Exchange*) generasi terbaru yang memadukan kecepatan eksekusi bursa terpusat (CEX) dengan transparansi dan keamanan absolut khas Web3. Dibangun di atas infrastruktur *smart contract* modular yang sangat dioptimalkan, platform ini secara khusus dirancang untuk memecahkan tiga masalah fundamental di ranah DeFi: latensi eksekusi yang tinggi, biaya *slippage* yang merugikan, dan risiko manipulasi harga oleh paus (*whale manipulation*).

---

## 1. 🚀 Keunggulan Arsitektur V7 (Direct-to-Vault)

Setelah melalui berbagai iterasi, Confidential DEX kini beroperasi dengan model **V7 Direct-to-Vault Execution** yang mengutamakan kecepatan dan kepastian eksekusi.

*   **Zero-Latency Settlement:** Mengeliminasi sistem antrean *Peer-to-Peer* lambat. Setiap pesanan (*Market*, *Limit*, *Stop*) langsung dibenturkan ke dalam *Liquidity Vault* untuk penyelesaian instan (1-langkah).
*   **Guaranteed Liquidity:** *Trader* tidak perlu menunggu lawan transaksi. Kapasitas Vault menjamin bahwa pesanan sebesar apa pun akan tereksekusi secara absolut selama utilitas Vault mencukupi.
*   **Zero-Delay Pipeline (Event-Driven):** Infrastruktur pencatatan *Goldsky GraphQL Subgraph* dan *Pyth Network* dikombinasikan secara asinkron. Setiap tekanan tombol "Buy" dari UI langsung memaketkan harga *Oracle* terkini ke dalam transaksi *blockchain*, menjamin nol jeda.

---

## 2. 🏦 Spesifikasi Likuiditas: Dual-Tranche Vault

Likuiditas di DEX ini disegmentasi menjadi dua lapisan brankas (*tranche*) independen dengan batas kapasitas maksimal absolut (Total TVL Cap) sebesar **$50.000.000 USDC**. Brankas beroperasi menggunakan standar ERC-4626 Tokenized Vault dengan sistem *Auto-Compounding* (cUSDC).

### 🔴 Degen Vault (Junior Tranche)
Diperuntukkan bagi penyedia likuiditas (LP) dengan profil risiko tinggi yang mendambakan pertumbuhan modal agresif.
*   **Kapasitas Maksimal (Porsi):** **$15.000.000** (30% dari Total TVL)
*   **Insentif Keuntungan:** Mendapatkan persentase laba **3x lipat lebih besar** dari seluruh pendapatan protokol (Biaya *Trading*, Likuidasi, *Funding Rate*, dan Kerugian *Trader*).
*   **Risiko (First-Loss):** Bertindak sebagai bantalan perisai pertama. Jika *trader* menang, uang kemenangan akan ditarik sepenuhnya dari Degen Vault terlebih dahulu. Degen Vault dapat tergerus hingga $0 (memicu *Epoch Reset*).
*   **Lockup Period:** 2 Hari (172.800 detik). Uang yang disetor akan dikunci selama 2 hari kalender absolut tanpa celah pintas.

### 🔵 Prime Vault (Senior Tranche)
Diperuntukkan bagi institusi atau *whale* yang mengutamakan keamanan dan apresiasi nilai konstan.
*   **Kapasitas Maksimal (Porsi):** **$35.000.000** (70% dari Total TVL)
*   **Insentif Keuntungan:** Mendapatkan sisa 1x porsi profit reguler. Kenaikan nilai *shares* berjalan perlahan namun memiliki resistensi tinggi terhadap kejatuhan tajam.
*   **Proteksi Ekstrem:** Dilindungi secara matematis dari risiko kebangkrutan (Lihat detail *Capital Protection* di Bab 3).
*   **Lockup Period:** 5 Hari (432.000 detik). Uang yang disetor dikunci lebih lama demi menjaga stabilitas cadangan kas bursa.

---

## 3. 🛡️ Proteksi Sistemik & Manajemen Risiko

Untuk menjaga roda ekonomi *smart contract* tetap berputar stabil, ekosistem dibekali dengan tembok pertahanan matematis:

### A. Vault Utilization Cap (Batas Maksimal Eksekusi) : `80%`
*   Berlaku saat *trader* **MEMBUKA** posisi.
*   Sistem tidak akan mengizinkan pembukaan posisi baru jika uang tunai yang sedang terpakai untuk menahan posisi berjalan (*Open Interest*) menyentuh **80%** dari saldo Vault. Sisa **20%** adalah dana kas (*Cash Reserve*) suci yang dijamin tersedia agar para LP selalu bisa menarik (*Withdraw*) aset mereka kapanpun tanpa kegagalan transaksi (*Revert*).

### B. Prime Capital Protection (Sabuk Pengaman Modal) : `70%`
*   Berlaku saat *trader* paus **MENUTUP** posisi (Membawa kemenangan raksasa).
*   Jika seorang *trader* mencetak profit tak terhingga hingga menguras $15 Juta dari Degen Vault menjadi $0, kerugian tersebut akan mulai bocor/merembes ke Prime Vault.
*   Namun, *Smart Contract* akan langsung menurunkan pemutus daya (*circuit breaker*): **Maksimal kerugian yang boleh ditanggung Prime Vault hanyalah 30%**. Sisa **70% dari Total Aset Prime Vault dikunci absolut** dan tidak dapat diklaim sebagai kemenangan *trader* (*Profit Capping*).

### C. Emergency Auto-Deleveraging (ADL) : `95%`
*   Garis pertahanan krisis likuiditas paling ekstrem. 
*   Jika karena satu dan lain hal pergerakan pasar menyebabkan utilitas kas Vault melonjak melebihi **95%**, *Keeper Bot* diberikan wewenang membunuh posisi-posisi menguntungkan (*profitable*) milik *trader* secara paksa untuk mengembalikan likuiditas ke zona aman.

---

## 4. 🤖 Peran Keeper Bot (Sistem Eksekusi Otomatis)

Eksekusi transaksi berjalan secara otomatis *(Automation)* di latar belakang berkat **Keeper Bot** yang menyala 24/7 di *server* independen:

1.  **Eksekusi Pending Order:** Mengawal posisi *Limit* dan *Stop Order* milik *trader*. Begitu target harga tersentuh oleh pergerakan data *Pyth Oracle*, Bot secara instan menyuntikkan fungsi penyelesaian (`executeOrder`) ke dalam *blockchain*.
2.  **Pemenggalan Likuidasi:** Memantau tingkat kesehatan kolateral (jaminan). Bot akan memenggal posisi jika rasio kebangkrutan tersentuh dan mendapatkan **imbalan tunai 1%** (*Liquidation Reward*) dari sisa jaminan *trader*.

*(Catatan: Fungsi eksekusi ini beroperasi 100% Permissionless, artinya siapapun di seluruh dunia berhak menyalakan bot mereka sendiri dan berkompetisi mendapatkan imbalan eksekusi).*

---

## 5. ✨ Eksekusi Fungsional Tingkat Institusi

*   **Zero Borrow Fee & Dynamic Funding Rate:** Membuang beban sewa *(borrow fee)* menjadi **0%** untuk meringankan *trader*. Risiko *directional* (kecenderungan mayoritas memegang posisi seragam) ditekan menggunakan pajak keseimbangan *(Funding Rate)*: Mayoritas mensubsidi Minoritas.
*   **Execution Buffer (Anti-Jarum) 0.3%:** Jika fluktuasi liar *(latency spike)* membuat harga bergeser menjauh dari SL/TP *trader* saat diproses di *blockchain*, eksekusi tetap sukses selama pergeserannya di bawah 0.3% *(30 bps)*.
*   **Harmonic Averaging Price:** Perhitungan *entry* baru saat *trader* menambah posisi menggunakan rata-rata harmonik, memblokir manipulasi taktik penambahan posisi buatan.
*   **TWAP (Time-Weighted Average Price):** Pemecah irisan order besar ke dalam rentang waktu terkalibrasi untuk meminimalkan dampak harga kuadratik.

---

## 6. 🔐 Lapis Pertahanan Anti-Eksploitasi Jaringan

1.  **Anti-Flash Loan & MEV (5-Second Cooldown):** Posisi yang baru saja dibuka mustahil ditutup atau dikutak-katik dalam waktu 5 detik. Mengeliminasi total eksploitasi serangan *Flash Loan* dalam satu siklus blok.
2.  **Oracle Confidence Interval:** Sistem menolak berdagang jika selisih rentang tebakan *(Confidence Interval)* dari data Pyth melebihi batas rasional akibat badai volatilitas eksternal.
3.  **Strict CEI (Checks-Effects-Interactions):** Semua perpindahan uang (USDC) dieksekusi murni di akhir baris setelah penurunan OI dan pencatatan PnL, menutup lubang maut *Reentrancy Attack*.
4.  **Anti-Donation Attack (ERC-4626):** Setoran deposit $1.000 pertama dalam Vault dikorbankan (*burnt*) permanen untuk mencegah eksploitasi inflasi rasio harga *shares*.
5.  **Automated Epoch Bankruptcy:** LP tidak mewarisi "utang" dari keruntuhan harga. Jika sebuah Vault tergerus hingga saldo $0 akibat kemenangan beruntun *trader*, *shares* akan direset bersih menjadi rasio 1:1 di Epoch baru.
