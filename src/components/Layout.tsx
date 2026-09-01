import { Outlet, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function Layout() {
  const { theme, setTheme, cart } = useStore();
  const location = useLocation();

  const handleThemeChange = async (p: string) => {
    setTheme(p);
    try {
      await setDoc(doc(db, 'settings', 'site_settings'), { theme: p }, { merge: true });
    } catch (err) {
      console.error('Failed to save theme', err);
    }
  };
  const palettes = ['zinc', 'blue', 'green', 'rose', 'orange', 'slate', 'teal', 'stone', 'purple', 'amber'];
  
  // Mapping of palette to hex for the exact design look
  const themeColors: Record<string, string> = {
    zinc: '#e4e4e7', blue: '#2563eb', green: '#059669', rose: '#e11d48',
    orange: '#fb923c', slate: '#94a3b8', teal: '#2dd4bf', stone: '#a8a29e',
    purple: '#a855f7', amber: '#f59e0b'
  };

  return (
    <div className='flex flex-row h-screen w-full bg-white text-neutral-900 font-sans overflow-hidden'>
      {/* Sidebar */}
      <aside className='w-64 border-r border-neutral-200 bg-neutral-50 p-6 flex flex-col justify-between shrink-0 hidden md:flex'>
        <div>
          <div className='font-bold text-lg tracking-tight mb-8'>ADMIN</div>
          <div className='space-y-6'>
            <div>
              <div className='text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3'>Color</div>
              <div className='grid grid-cols-5 gap-2'>
                {palettes.map(p => (
                  <button 
                    key={p} 
                    onClick={() => handleThemeChange(p)}
                    className={`w-6 h-6 rounded-full ${theme === p ? 'ring-2 ring-offset-2 ring-primary' : 'border border-neutral-300'}`}
                    style={{ backgroundColor: themeColors[p] || '#000' }}
                    title={p}
                  />
                ))}
              </div>
            </div>
            <nav className='space-y-1'>
              <Link to="/" className={`block px-3 py-2 text-sm font-medium rounded-md ${location.pathname === '/' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Product Listing</Link>
              <Link to="/admin" className={`block px-3 py-2 text-sm font-medium rounded-md ${location.pathname === '/admin' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Orders & Admin</Link>
              <Link to="/checkout" className={`block px-3 py-2 text-sm font-medium rounded-md ${location.pathname === '/checkout' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Checkout</Link>
            </nav>
          </div>
        </div>
        <div className='mt-auto pt-6 border-t border-neutral-200'>
          <div className='text-xs text-neutral-400'>Verified Admin Session</div>
          <div className='text-xs font-mono mt-1'>0xNWOC-ADMIN</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 flex flex-col bg-white overflow-hidden'>
        <header className='h-16 border-b border-neutral-100 flex items-center justify-between px-8 shrink-0'>
          <div className='flex items-center gap-4'>
            <Link to="/" className="flex items-center gap-4 group">
              <div className='w-8 h-8 bg-primary flex items-center justify-center text-primary-fg font-bold text-xs group-hover:opacity-90 transition-colors'>3D</div>
              <span className='text-sm font-semibold uppercase tracking-wider hidden sm:block'>Files</span>
            </Link>
          </div>
          <div className='flex items-center gap-6'>
            <Link to="/checkout" className="flex items-center gap-2 relative">
              <svg className="w-5 h-5 text-neutral-600 hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-primary-fg text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">{cart.length}</span>
              )}
            </Link>
            <div className='flex items-center gap-2 bg-[#00D632]/10 px-3 py-1.5 rounded-full'>
              <div className='w-2 h-2 bg-[#00D632] rounded-full'></div>
              <span className='text-xs font-bold text-[#00D632]'>Pay with Cash App</span>
            </div>
            <Link to="/admin" className="md:hidden text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors">
              Menu
            </Link>
          </div>
        </header>

        <section className='flex-1 p-8 overflow-y-auto'>
          <Outlet />
        </section>

        <footer className='h-24 border-t border-neutral-100 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between px-8 gap-8 shrink-0'>
          <div>
            <div className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1'>Safety Verification</div>
            <div className='text-xs leading-relaxed text-neutral-600 max-w-md'>
              All users must be 18+ to purchase. Files are for legal hobbyist use only. All sales are final and subject to automated verification of payment receipt via Cash App.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
