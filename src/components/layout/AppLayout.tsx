import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
