import MarketSidebar from '../components/MarketSidebar'
import PriceChart from '../components/PriceChart'
import OrderBook from '../components/OrderBook'
import OrderForm from '../components/OrderForm'
import Positions from '../components/Positions'

export default function Trade() {
  return (
    <div className="trade-layout">
      <div className="trade-sidebar">
        <MarketSidebar />
      </div>
      <div className="trade-center">
        <div className="trade-chart">
          <PriceChart />
        </div>
        <div className="trade-positions">
          <Positions />
        </div>
      </div>
      <div className="trade-right">
        <div className="trade-order-form">
          <OrderForm />
        </div>
        <div className="trade-orderbook">
          <OrderBook />
        </div>
      </div>

      <style>{`
        .trade-layout {
          display: grid;
          grid-template-columns: 200px 1fr 300px;
          height: calc(100vh - 52px);
          overflow: hidden;
        }
        .trade-sidebar {
          border-right: 1px solid var(--color-border);
          overflow-y: auto;
          background: var(--color-bg0);
        }
        .trade-center {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .trade-chart {
          flex: 1;
          min-height: 0;
          border-bottom: 1px solid var(--color-border);
        }
        .trade-positions {
          height: 250px;
          flex-shrink: 0;
          overflow-y: auto;
          background: var(--color-bg0);
        }
        .trade-right {
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--color-border);
          overflow: hidden;
          background: var(--color-bg1);
        }
        .trade-order-form {
          flex-shrink: 0;
          border-bottom: 1px solid var(--color-border);
        }
        .trade-orderbook {
          flex: 1;
          overflow: hidden;
        }

        /* ═══ Mobile Responsiveness ═══ */
        @media (max-width: 1024px) {
          .trade-layout {
            display: flex;
            flex-direction: column;
            height: auto;
            overflow: visible;
          }
          .trade-sidebar {
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            max-height: 250px;
          }
          .trade-center {
            height: auto;
          }
          .trade-chart {
            min-height: 400px;
            flex: none;
          }
          .trade-right {
            border-left: none;
            border-top: 1px solid var(--color-border);
          }
          .trade-order-form {
            border-bottom: 1px solid var(--color-border);
          }
          .trade-orderbook {
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  )
}
