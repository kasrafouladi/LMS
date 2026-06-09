import type { ReactNode } from 'react';
import Sidebar, { type PageKey } from './Sidebar';
import Header from './Header';

interface LayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export default function Layout({ activePage, onNavigate, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="page-content">
        <Header activePage={activePage} />
        <main className="main-area animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
