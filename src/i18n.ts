import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// --- ENGLISH ---
const en = {
  translation: {
    nav: {
      trade: "Trade",
      portfolio: "Portfolio",
      vault: "Vault",
      referrals: "Referrals",
      points: "Points",
      leaderboard: "Leaderboard"
    },
    home: {
      heroTitle: "The Liquidity Layer for Confidential Trading",
      heroSubtitle: "Decentralized Perpetual Exchange on Arc Network. Trade Crypto, Forex, and Commodities with up to 100x leverage directly from your wallet.",
      startTrading: "Start Trading",
      provideLiquidity: "Provide Liquidity",
      metrics: {
        totalVolume: "Total Volume",
        totalTVL: "Vault TVL",
        openInterest: "Open Interest"
      },
      features: {
        f1Title: "Zero Price Impact",
        f1Desc: "Execute trades exactly at Oracle prices. No orderbook slippage, regardless of your trade size. Deep liquidity guaranteed up to the global Open Interest cap.",
        f2Title: "Unified Margin Account",
        f2Desc: "Trade Crypto, Forex, and Commodities from a single USDC collateral pool. Seamlessly manage risk across entirely different asset classes.",
        f3Title: "Real Yield Vault",
        f3Desc: "Liquidity providers act as the counterparty to all trades. Earn real USDC yield directly from trader losses, funding fees, and liquidations without active management."
      },
      partners: {
        title: "Trusted Infrastructure",
        p1Title: "Pyth Network",
        p1Desc: "Utilizing sub-second, high-fidelity pull oracles to ensure bulletproof pricing and eliminate front-running.",
        p2Title: "Arc Network",
        p2Desc: "Built on the high-performance Arc blockchain for lightning-fast execution, instant finality, and near-zero gas fees.",
        p3Title: "Goldsky",
        p3Desc: "Powered by custom, high-speed subgraphs to ensure the trading interface is always perfectly synced with on-chain data."
      }
    }
  }
}

// --- INDONESIAN ---
const id = {
  translation: {
    nav: {
      trade: "Perdagangan",
      portfolio: "Portofolio",
      vault: "Brankas",
      referrals: "Rujukan",
      points: "Poin",
      leaderboard: "Papan Peringkat"
    },
    home: {
      heroTitle: "Lapisan Likuiditas untuk Perdagangan Rahasia",
      heroSubtitle: "Pertukaran Berjangka Terdesentralisasi di Arc Network. Perdagangkan Kripto, Forex, dan Komoditas hingga leverage 100x langsung dari dompet Anda.",
      startTrading: "Mulai Trading",
      provideLiquidity: "Sediakan Likuiditas",
      metrics: {
        totalVolume: "Total Volume",
        totalTVL: "TVL Brankas",
        openInterest: "Minat Terbuka (OI)"
      },
      features: {
        f1Title: "Tanpa Dampak Harga",
        f1Desc: "Eksekusi perdagangan persis di harga Oracle. Tanpa selip (slippage) berapapun ukuran pesanan Anda. Likuiditas dalam terjamin hingga batas Open Interest global.",
        f2Title: "Akun Margin Terpadu",
        f2Desc: "Perdagangkan Kripto, Forex, dan Komoditas dari satu pool jaminan USDC. Kelola risiko dengan mulus di berbagai kelas aset yang berbeda.",
        f3Title: "Brankas Hasil Nyata",
        f3Desc: "Penyedia likuiditas bertindak sebagai pihak lawan untuk semua perdagangan. Dapatkan hasil USDC nyata dari kerugian trader, biaya pendanaan, dan likuidasi tanpa manajemen aktif."
      },
      partners: {
        title: "Infrastruktur Terpercaya",
        p1Title: "Pyth Network",
        p1Desc: "Menggunakan oracle dengan latensi sub-detik untuk memastikan harga akurat dan mencegah manipulasi (front-running).",
        p2Title: "Arc Network",
        p2Desc: "Dibangun di atas blockchain Arc berkinerja tinggi untuk eksekusi secepat kilat, finalitas instan, dan biaya gas mendekati nol.",
        p3Title: "Goldsky",
        p3Desc: "Didukung oleh subgraph berkecepatan tinggi khusus untuk memastikan antarmuka selalu tersinkronisasi sempurna dengan data on-chain."
      }
    }
  }
}

// --- VIETNAMESE ---
const vi = {
  translation: {
    nav: {
      trade: "Giao dịch",
      portfolio: "Danh mục",
      vault: "Kho tiền",
      referrals: "Giới thiệu",
      points: "Điểm",
      leaderboard: "Bảng xếp hạng"
    },
    home: {
      heroTitle: "Lớp thanh khoản cho Giao dịch bảo mật",
      heroSubtitle: "Sàn giao dịch phi tập trung trên Arc Network. Giao dịch Crypto, Forex và Hàng hóa với đòn bẩy lên tới 100x trực tiếp từ ví của bạn.",
      startTrading: "Bắt đầu Giao dịch",
      provideLiquidity: "Cung cấp Thanh khoản",
      metrics: {
        totalVolume: "Tổng khối lượng",
        totalTVL: "TVL Kho tiền",
        openInterest: "Hợp đồng mở"
      },
      features: {
        f1Title: "Không Trượt Giá",
        f1Desc: "Khớp lệnh chính xác tại giá Oracle. Không trượt giá, bất kể khối lượng. Thanh khoản sâu được đảm bảo lên đến giới hạn Hợp đồng mở toàn cầu.",
        f2Title: "Tài khoản Ký quỹ Thống nhất",
        f2Desc: "Giao dịch Crypto, Forex và Hàng hóa từ một nguồn vốn USDC duy nhất. Quản lý rủi ro liền mạch trên các lớp tài sản hoàn toàn khác biệt.",
        f3Title: "Kho tiền Lợi nhuận Thực",
        f3Desc: "Người cung cấp thanh khoản đóng vai trò đối tác cho tất cả giao dịch. Kiếm lợi nhuận USDC thực tế trực tiếp từ tổn thất của người giao dịch, phí cấp vốn và thanh lý mà không cần quản lý chủ động."
      },
      partners: {
        title: "Cơ sở Hạ tầng Đáng tin cậy",
        p1Title: "Pyth Network",
        p1Desc: "Sử dụng oracle có độ trễ dưới một giây để đảm bảo giá chính xác và loại bỏ front-running.",
        p2Title: "Arc Network",
        p2Desc: "Xây dựng trên blockchain Arc hiệu suất cao cho tốc độ khớp lệnh chớp nhoáng, hoàn tất tức thì và phí gas gần như bằng không.",
        p3Title: "Goldsky",
        p3Desc: "Được hỗ trợ bởi các subgraph tốc độ cao tùy chỉnh để đảm bảo giao diện giao dịch luôn đồng bộ hoàn hảo với dữ liệu on-chain."
      }
    }
  }
}

// --- CHINESE ---
const zh = {
  translation: {
    nav: {
      trade: "交易",
      portfolio: "投资组合",
      vault: "金库",
      referrals: "推荐",
      points: "积分",
      leaderboard: "排行榜"
    },
    home: {
      heroTitle: "机密交易的流动性层",
      heroSubtitle: "Arc Network 上的去中心化永续合约交易所。直接从您的钱包进行高达 100 倍杠杆的加密货币、外汇和商品交易。",
      startTrading: "开始交易",
      provideLiquidity: "提供流动性",
      metrics: {
        totalVolume: "总交易量",
        totalTVL: "金库锁仓量",
        openInterest: "未平仓合约"
      },
      features: {
        f1Title: "零价格影响",
        f1Desc: "完全以预言机价格执行交易。无论交易规模多大，都没有滑点。在全局未平仓合约上限内保证深度流动性。",
        f2Title: "统一保证金账户",
        f2Desc: "使用单一 USDC 抵押池进行加密货币、外汇和商品交易。无缝管理完全不同资产类别之间的风险。",
        f3Title: "真实收益金库",
        f3Desc: "流动性提供者充当所有交易的对手方。无需主动管理，即可直接从交易者损失、资金费率和清算中赚取真实的 USDC 收益。"
      },
      partners: {
        title: "值得信赖的基础设施",
        p1Title: "Pyth Network",
        p1Desc: "利用亚秒级、高保真的拉取式预言机，确保定价无懈可击并消除抢先交易。",
        p2Title: "Arc Network",
        p2Desc: "构建在高性能 Arc 区块链上，实现闪电般的执行速度、即时最终性和近乎为零的 Gas 费用。",
        p3Title: "Goldsky",
        p3Desc: "由定制的高速子图提供支持，确保交易界面始终与链上数据完美同步。"
      }
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      id,
      vi,
      zh
    },
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })

export default i18n
