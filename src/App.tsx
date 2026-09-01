/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store';
import { db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

import Layout from './components/Layout';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';

export default function App() {
  const { theme, setTheme } = useStore();

  useEffect(() => {
    // Load theme from Firestore
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'site_settings'));
        if (snap.exists() && snap.data().theme) {
          setTheme(snap.data().theme);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    }
    loadSettings();
  }, [setTheme]);

  return (
    <div className={`min-h-screen font-sans ${theme !== 'zinc' ? `theme-${theme}` : ''}`}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

