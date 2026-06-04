import { NavLink } from 'react-router-dom'

export default function MobileTabs() {
  return (
    <>
      <div className="mobile-tabs mobile-only">
        <NavLink to="/" end className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          Trade
        </NavLink>
        <NavLink to="/portfolio" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          Portfolio
        </NavLink>
      </div>

      <style>{`
        .mobile-tabs {
          display: flex;
          background: var(--color-bg1);
          border-bottom: 1px solid var(--color-border);
        }
        .mobile-tab {
          flex: 1;
          text-align: center;
          padding: 14px 0;
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text3);
          text-decoration: none;
          border-bottom: 2px solid transparent;
          transition: all 150ms ease;
        }
        .mobile-tab.active {
          color: var(--color-text1);
          border-bottom-color: var(--color-text1);
        }
        @media (min-width: 769px) {
          .mobile-tabs {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
