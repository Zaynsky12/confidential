# 📘 Panduan Arsitektur & Keamanan Confidential DEX

**Confidential DEX** adalah bursa derivatif terdesentralisasi (*Decentralized Perpetual Exchange*) generasi terbaru yang memadukan kecepatan eksekusi bursa terpusat (CEX) dengan transparansi dan keamanan absolut khas Web3. Dibangun di atas infrastruktur *smart contract* modular yang sangat dioptimalkan, platform ini secara khusus dirancang untuk memecahkan tiga masalah fundamental di ranah DeFi: latensi eksekusi yang tinggi, biaya *slippage* yang merugikan, dan risiko manipulasi harga oleh paus (*whale manipulation*).

### 🚀 Keunggulan Utama

1. **Kecepatan Setara CEX dengan Jeda Pintar 2 Detik:** Melalui integrasi infrastruktur *Oracle Pyth* yang menyuntikkan harga seketika, pesanan (*Market*, *Limit*, *Stop*) dimasukkan ke dalam "Ember Waktu 2 Detik" (Asynchronous Batching) oleh Keeper Bot. Jeda sangat singkat ini memberikan kesempatan bagi sistem untuk mencarikan lawan P2P sebelum dilempar ke Vault.
2. **Zero Slippage via Hybrid P2P Matching:** Berbeda dengan DEX AMM konvensional yang membebankan *price impact* tinggi pada setiap pesanan, mesin pencocokan *Confidential* memprioritaskan benturan pesanan *Long* dan *Short* secara *on-chain* di dalam satu *batch*. Hasilnya adalah eksekusi harga sempurna (0% slippage) tepat di harga Oracle saat itu.
3. **Likuiditas Super Dalam (Guaranteed Liquidity):** Didukung penuh oleh *Automated Market Maker* (AMM) bertingkat sebagai lapisan cadangan (*fallback*), *trader* tidak akan pernah kekurangan lawan transaksi. Ukuran pesanan raksasa dapat diakomodasi kapan saja tanpa hambatan.
4. **Proteksi Modal Institusional (70% Prime Protection):** Sebagai pelopor sistem *Dual-Tranche Vault*, Confidential DEX melindungi Penyedia Likuiditas (*Liquidity Provider*) kelas *Prime* secara matematis di tingkat *smart contract*. Eksposur kerugian maksimal mereka dibatasi dengan ketat, menjadikan DEX ini instrumen *yield* yang aman bagi dana institusional.

---

## 1. 🏗️ Model Arsitektur: 100% On-Chain Hybrid P2P + PLP

Setelah melalui berbagai iterasi pengujian keamanan, Confidential DEX bertransisi dari model *Peer-to-Pool* murni menuju arsitektur **Hybrid Peer-to-Peer (P2P) + Peer-to-Liquidity Pool (PLP)**.

Sistem *Limit* dan *Market* tradisional seringkali rentan terhadap manipulasi atau membebankan *slippage* yang tidak masuk akal. Dengan arsitektur Hybrid *On-Chain* kami:
- **Anti-Spam:** Setiap pembuatan pesanan mewajibkan komitmen kolateral (USDC) di awal, mengeliminasi risiko pembengkakan antrean palsu (*order spamming*).
- **Kepastian Eksekusi Ekstrem:** Pesanan tidak harus menunggu lawan. Jika P2P tidak tersedia, likuiditas dari *Vault* (PLP) akan otomatis mengeksekusi pesanan tanpa jeda.

---

## 2. ⚡ Mesin Pencocokan "Hybrid Order-Book"

Logika eksekusi Confidential DEX menggabungkan efisiensi *Order-book* dengan kedalaman likuiditas *Passive Liquidity Pool (Vault)* untuk meminimalisir risiko bagi *Liquidity Provider* (LP) sekaligus memberikan harga terbaik bagi *trader*.

### Cara Kerja Pencocokan Dua Lapis (Ember 2 Detik):

1. **Lapis Pertama (P2P Order-Book — Zero Slippage):** Bot *sequencer* mengumpulkan semua pesanan *Market*, *Limit*, dan *Stop* yang masuk dalam jendela waktu 2 detik. Jika ada *Long* dan *Short* yang bersinggungan di harga Oracle, keduanya dibenturkan secara langsung. *Vault* sama sekali tidak menanggung risiko jaminan, dan kedua *trader* menikmati eksekusi dengan **0% Slippage**.
2. **Lapis Kedua (PLP Fallback):** Sisa volume pesanan yang tidak memiliki pasangan P2P dalam jeda 2 detik tersebut akan otomatis dilempar ke *Vault* untuk dieksekusi dengan *Slippage* standar AMM. Pesanan *Close*, *TP*, *SL*, dan *TWAP* selalu dieksekusi di lapis kedua ini untuk menjamin penyelesaian PnL yang absolut.

### 🔍 Analogi Eksekusi (Kasus: $5K Long vs $10K Short)

- **Trader A** memasang order **LONG $5,000**
- **Trader B** memasang order **SHORT $10,000** di harga yang sama

Saat dieksekusi melalui fitur `executeHybridBatch`, inilah yang terjadi secara *on-chain*:

| Tahap Pemrosesan | Lawan Transaksi | Volume Eksekusi | Risiko Vault (LP) | Price Impact |
|---|---|---|---|---|
| **Tahap 1 (P2P)** | Trader A ($5K) ⚔️ Trader B ($5K) | $5,000 | **TIDAK ADA** | **0%** |
| **Tahap 2 (PLP)** | Sisa Trader B ($5K) ⚔️ Vault | $5,000 | Ditanggung Vault | Ada (Standar) |

**Hasil Eksekusi Akhir:**
- **Trader A (Long $5K):** Posisi terbuka penuh 100% dengan **0% Slippage**.
- **Trader B (Short $10K):** Posisi terbuka penuh 100%. Sistem pintar kami menerapkan **Blended Price Impact (Slippage Rata-rata)**. *Slippage* hanya dihitung dari sisa $5.000 beban *Vault*, lalu dirata-ratakan secara proporsional ke total $10.000 pesanan. Trader B menikmati "diskon slippage" berkat efisiensi P2P.
- **Vault LP:** Mengalami penghematan risiko drastis, dari yang seharusnya menanggung eksposur $15.000, kini hanya menanggung arah *Short* sebesar $5.000.

---

## 3. 🤖 Sistem Eksekusi Otomatis & Peran Keeper Bot

Ekosistem Confidential DEX dirancang secara hibrida antara desentralisasi penuh dan keamanan terpusat. Fungsi eksekusi pesanan normal (`executeOrder`, `executeTPSL`, dan `liquidate`) beroperasi secara **100% Permissionless** (siapa saja dapat menjadi eksekutor). Namun, untuk fitur pencocokan *P2P Batch* (`executeHybridBatch`), hanya **Keeper Bot Resmi** yang terdaftar di *Smart Contract* yang diizinkan memicunya demi menjamin keamanan dan efisiensi *batching*.

Terdapat tiga mandat krusial bagi sistem Keeper:

### A. Pencocokan P2P Massal (`executeHybridBatch` - Khusus Keeper Resmi)
- **Tugas:** Menyatukan kelompok pesanan *Long* dan *Short* yang saling melengkapi dan mengeksekusinya dalam satu transaksi *batch* untuk efisiensi gas dan *zero-slippage*.

### B. Eksekusi Pesanan Individu (`executeOrder` & `executeTPSL`)
- **Tugas:** Memantau pergerakan harga *Oracle* secara *real-time*. Begitu menyentuh target *Limit*, *Stop Loss*, atau jadwal irisan *TWAP*, Bot akan memicu eksekusi *on-chain*.
- **Imbalan:** Bot eksekutor pertama mengklaim **100% Execution Fee** (dalam bentuk koin *native* jaringan) yang telah dialokasikan trader sebelumnya.

### C. Likuidasi Posisi Kritis (`liquidate`)
- **Tugas:** Memantau kesehatan *Margin* (kolateral) dari setiap posisi aktif. Jika saldo jaminan dikurangi *Net PnL* dan biaya bergulir telah melampaui ambang kebangkrutan, Bot wajib membunuh posisi tersebut.
- **Imbalan:** Bot menerima **Liquidation Reward instan sebesar 1%** dari *Effective Collateral* trader yang tersisa.

---

## 4. ⚖️ Dua Benteng Likuiditas: Utilization Cap vs Prime Protection

Untuk mengeliminasi risiko insolvensi dan melindungi modal investor, protokol ini mengadopsi dua lapis pembatasan matematis:

### A. Vault Utilization Cap (Batas Eksposur Trading)
Beroperasi sebagai gerbang keamanan saat trader **MEMBUKA** posisi.
- **Batas Maksimal:** `80%` dari total likuiditas gabungan (Degen + Prime).
- **Fungsi:** Menyisakan cadangan tunai (*cash reserve*) sebesar 20% secara permanen. Hal ini menjamin bahwa setiap permintaan penarikan (*withdraw*) oleh LP atau pencairan *Take Profit* oleh trader akan selalu sukses diproses tanpa status *revert* akibat kekosongan dana cair.

### B. Prime Capital Protection (Sabuk Pengaman Modal)
Beroperasi sebagai mitigasi risiko ekstrem saat trader memenangkan transaksi raksasa dan **MENUTUP** posisi.
- **Tingkat Perlindungan:** `70%` dari likuiditas Prime Vault.
- **Fungsi:** Menghentikan perembesan kerugian (*Profit Capping*). Sekalipun kemenangan trader mampu menguras Degen Vault secara total hingga $0, *Smart Contract* akan membekukan 70% sisa modal Prime Vault. Dana ini mutlak dilindungi dan tidak dapat ditarik sebagai kemenangan trader.

---

## 5. 🏦 Arsitektur Dual-Tranche Vault (Degen vs Prime)

Likuiditas di DEX ini disegmentasi menjadi dua lapisan brankas independen dengan profil risiko yang bertolak belakang:

### 🔄 Mekanisme Auto-Compounding (USDC ↔ cUSDC)
Vault beroperasi menggunakan standar **ERC-4626 Tokenized Vault**.
1. **Deposit (Minting):** LP menyetorkan *USDC* dan menerima resi *cUSDC* (*Confidential USDC*) yang merepresentasikan nilai saham (*shares*) dari total *pool*.
2. **Apresiasi Harga:** Setiap kali protokol mendulang pendapatan dari *Trading Fee*, Biaya Bergulir, atau kerugian PnL trader, pasokan fisik *USDC* bertambah sementara keping *cUSDC* tetap. Secara matematis, rasio tukar 1 *cUSDC* akan terus naik melampaui $1.
3. **Withdrawal (Burning):** LP mengembalikan *cUSDC* mereka ke *Smart Contract* dan menerima lebih banyak *USDC* daripada modal awal mereka. Sistem ini menghapus kebutuhan tombol "Claim Reward" yang memboroskan gas.

### Profil Risiko Brankas:

#### 🔴 Degen Vault (First-Loss Tranche)
- **Karakter:** Berisiko tinggi dengan imbal hasil agresif. Mendapatkan persentase laba **3x lipat lebih besar** dari total ekosistem.
- **Porsi Total:** 30% dari Total Maksimal Deposit Vault.
- **Risiko Tameng:** Berfungsi sebagai bantalan pertama. Jika trader profit, uang ditarik dari Degen Vault terlebih dahulu. Vault ini dapat tergerus hingga $0 (memicu *Epoch Reset*).
- **Lockup Period:** 2 Hari (172.800 detik).

#### 🔵 Prime Vault (Senior Tranche)
- **Karakter:** Stabil dan defensif. Kenaikan harga *cUSDC Prime* berlangsung konsisten tanpa gejolak tajam.
- **Porsi Total:** 70% dari Total Maksimal Deposit Vault.
- **Proteksi Ekstrem:** Dilindungi oleh benteng **Capital Protection 70%**.
- **Lockup Period:** 5 Hari (432.000 detik).

---

## 6. ✨ Eksekusi Fungsional Kelas Institusi

1. **TWAP (Time-Weighted Average Price):** Algoritma pemecah *order* masif menjadi irisan-irisan kecil (*slices*) secara berkala. *Smart contract* mengakumulasi sisa presisi irisan di akhir siklus untuk menihilkan *rounding loss*.
2. **Averaging (Increase Position):** Menambahkan volume pada posisi terbuka menggunakan perhitungan **Harmonic Average Price**, sebuah formula anti-eksploitasi yang kebal dari manipulasi PnL buatan.
3. **Instant Partial Close:** Menutup sebagian volume posisi untuk merealisasikan profit tanpa harus melikuidasi keseluruhan transaksi.
4. **Dynamic TP / SL & Harga Terjamin (Guaranteed Execution):** Modifikasi titik *Take Profit* dan *Stop Loss* dapat dilakukan secara dinamis kapanpun. Saat target tersentuh, PnL *trader* dikunci mutlak menggunakan angka target tersebut (*Guaranteed Price*), mengamankan *trader* dari kerugian selisih harga eksekusi di jaringan (*slippage*).
5. **Execution Buffer (Anti-Jarum):** Transaksi otomatis dilindungi oleh batas toleransi keterlambatan jaringan sebesar 0.3% (30 bps). Jika fluktuasi liar ("jarum") membuat harga berbalik menjauhi TP/SL saat transaksi diproses *blockchain*, pesanan tetap sukses dieksekusi selama pantulannya tidak melewati batas 0.3%. Selisih kerugian *latency* ini didanai (disubsidi) oleh Vault untuk memberikan pengalaman trading setara GMX.
6. **Adjustable Collateral:** Penambahan atau pengurangan jaminan (*margin*) untuk mengelola risiko likuidasi secara presisi.
7. **Continuous Funding Rate & Zero Borrow Fee:** Menghilangkan beban *Rollover/Borrow Fee* (0%) untuk memanjakan *trader*. Sebagai gantinya, risiko arah pasar dikelola sepenuhnya melalui *Dynamic Funding Rate*—pajak penyeimbang pasar di mana kelompok mayoritas (misal *Long*) membayar insentif bergulir kepada kelompok minoritas (*Short*). Ini menjamin *Vault* bebas dari risiko satu arah (*directional risk*).

---

## 7. 🛡️ 13 Lapis Pertahanan Anti-Eksploitasi (Smart Contract)

Protokol ini dipersenjatai dengan 13 pengaman tingkat tinggi untuk menghalau vektor serangan DeFi:

1. **Anti-Flash Loan & MEV (5-Second Cooldown):** Segala bentuk pembukaan atau penutupan posisi, termasuk memicu target TP/SL, terkunci mutlak selama 5 detik sejak pesanan awal, menetralkan eksploitasi arbitrase *Flash Loan* lintas-blok. (Catatan: *Trader* bebas memperbarui angka target TP/SL mereka kapan saja).
2. **Dynamic Solvency Check:** Saat merealisasikan profit, kontrak memverifikasi likuiditas *USDC* fisik. Jika terjadi defisit ekstrem, profit disesuaikan secara dinamis untuk mencegah *revert* sistemik.
3. **Strict CEI (Checks-Effects-Interactions):** Semua fungsi mutasi status (penurunan OI, pembaruan PnL) dieksekusi **sebelum** uang ditransfer keluar. Mengeliminasi celah *Reentrancy Attack*.
4. **Oracle Confidence Interval:** Transaksi otomatis dibatalkan jika *spread* volatilitas data harga dari Pyth melebihi standar deviasi yang sehat, memblokir perdagangan di harga semu.
5. **Emergency ADL (Auto-Deleveraging):** Posisi sehat hanya dapat dipaksa tutup oleh *Keeper* jika Utilisasi Vault menyentuh angka kritis (> 95%), mencegah likuidasi sepihak di kondisi normal.
6. **Quadratic Price Impact:** Paus yang mencoba menyerap likuiditas tunggal akan dihadapkan pada penalti slippage kuadratik, menciptakan ketidakefisienan ekonomi bagi penyerang.
7. **TWAP Re-Validation:** Irisan eksekusi TWAP senantiasa divalidasi ulang dengan batasan *Open Interest* secara *real-time*, menihilkan serangan penumpukan order masa depan.
8. **Closing Fee Accounting:** Mencegah kebocoran ganda (*Double Extraction*) melalui rekonsiliasi biaya internal Vault sebelum didistribusikan ke dompet *Treasury*.
9. **Anti-Donation Attack (ERC-4626):** Deposit awal LP akan mengunci sebagian fraksi saham (*Minimum Liquidity*) secara permanen, menyumbat jalur serangan inflasi nilai *shares*.
10. **Automated Epoch Bankruptcy:** Jika *Vault* terkuras habis, sistem mereset rasio *shares* menjadi 1:1, menolak beban hutang (*negative equity*) bagi LP di siklus berikutnya.
11. **Slippage Hard-Revert:** Garis pertahanan terakhir yang langsung membatalkan eksekusi jika pergeseran harga eksternal merugikan ambang batas *trader*.
12. **2-Step Admin Transfer:** Mencegah musibah pengambilalihan tak terduga (*fat-finger error*) saat memindahkan hak akses *Ownership* ke dompet lain.
13. **Anti-Whale P2P Exploit (Blended Impact):** Menggagalkan taktik eksploitasi di mana Paus memancing likuiditas P2P mikro untuk mendapatkan 0% *slippage* pada pesanan raksasa. Sistem *Blended Impact* memastikan Paus tetap menanggung penalti *slippage* AMM sesuai bobot volume pesanan yang ditanggung oleh *Vault*.
