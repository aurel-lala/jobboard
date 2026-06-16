import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-body)]">
      <Navbar />
      <main className="flex-1 pt-[var(--header-height)]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
