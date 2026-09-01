import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, addDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useStore } from '../store';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);

  const palettes = ['zinc', 'slate', 'red', 'blue', 'green', 'orange', 'purple', 'stone', 'teal', 'rose'];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [orderToApprove, setOrderToApprove] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', description: '', imageUrls: '', fileUrl: '', format: '.STL', license: 'Personal Hobby', polygons: 'Standard', printReady: 'Yes' });

  const loadData = async () => {
    const pSnap = await getDocs(collection(db, 'products'));
    setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const oSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    setOrders(oSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateTheme = async (newTheme: string) => {
    setTheme(newTheme);
    await setDoc(doc(db, 'settings', 'site_settings'), { theme: newTheme }, { merge: true });
  };

  const submitNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title) return;
    
    try {
      const urls = newProduct.imageUrls.split(',').map(u => u.trim()).filter(Boolean);

      if (editingProductId) {
        await updateDoc(doc(db, 'products', editingProductId), {
          title: newProduct.title,
          price: parseFloat(newProduct.price || '0'),
          description: newProduct.description,
          imageUrls: urls,
          imageUrl: urls[0] || '',
          fileUrl: newProduct.fileUrl,
          format: newProduct.format,
          license: newProduct.license,
          polygons: newProduct.polygons,
          printReady: newProduct.printReady,
        });
      } else {
        await addDoc(collection(db, 'products'), {
          title: newProduct.title,
          price: parseFloat(newProduct.price || '0'),
          description: newProduct.description,
          imageUrls: urls,
          imageUrl: urls[0] || '', // Fallback for backward compatibility
          fileUrl: newProduct.fileUrl,
          format: newProduct.format,
          license: newProduct.license,
          polygons: newProduct.polygons,
          printReady: newProduct.printReady,
          active: true,
          createdAt: new Date().toISOString()
        });
      }
      setNewProduct({ title: '', price: '', description: '', imageUrls: '', fileUrl: '', format: '.STL', license: 'Personal Hobby', polygons: 'Standard', printReady: 'Yes' });
      setIsAddingProduct(false);
      setEditingProductId(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditProduct = (p: any) => {
    setEditingProductId(p.id);
    setNewProduct({
      title: p.title || '',
      price: p.price ? p.price.toString() : '0',
      description: p.description || '',
      imageUrls: p.imageUrls ? p.imageUrls.join(', ') : (p.imageUrl || ''),
      fileUrl: p.fileUrl || '',
      format: p.format || '.STL',
      license: p.license || 'Personal Hobby',
      polygons: p.polygons || 'Standard',
      printReady: p.printReady || 'Yes'
    });
    setIsAddingProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleProduct = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'products', id), { active: !currentStatus });
    loadData();
  };

  const confirmDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProductToDelete(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const confirmApproveOrder = async (order: any) => {
    try {
      const orderItems = order.items ? order.items : [{ id: order.productId, title: 'Item' }];
      const itemsPayload = orderItems.map((i: any) => {
        const p = products.find(prod => prod.id === i.id);
        return { title: p ? p.title : i.title, downloadLink: p ? p.fileUrl : '' };
      }).filter((i: any) => i.downloadLink);

      if (itemsPayload.length === 0) throw new Error("No valid products found for this order");

      const token = await auth.currentUser?.getIdToken();
      
      const res = await fetch('/api/approve-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: token,
          orderId: order.id,
          items: itemsPayload,
          customerEmail: order.customerEmail
        })
      });
      
      if (!res.ok) throw new Error("Failed to send approval");
      
      await updateDoc(doc(db, 'orders', order.id), { status: 'approved' });
      setOrderToApprove(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-sm mx-auto py-20 text-center">
        <h2 className="text-2xl font-light tracking-tight mb-8 text-neutral-900">Admin Login</h2>
        <button onClick={handleAuth} className="w-full py-4 mt-2 bg-primary text-primary-fg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-colors">
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end border-b border-neutral-200 pb-4">
        <h1 className="text-2xl font-light tracking-tight text-neutral-900">Admin Dashboard</h1>
        <button onClick={() => signOut(auth)} className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors">Sign Out</button>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Products</h2>
          <button onClick={() => {
            setIsAddingProduct(!isAddingProduct);
            setEditingProductId(null);
            if (!isAddingProduct) setNewProduct({ title: '', price: '', description: '', imageUrls: '', fileUrl: '', format: '.STL', license: 'Personal Hobby', polygons: 'Standard', printReady: 'Yes' });
          }} className="px-4 py-2 bg-primary text-primary-fg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-colors">
            {isAddingProduct ? 'Cancel' : 'Add New Item'}
          </button>
        </div>
        
        {isAddingProduct && (
          <form onSubmit={submitNewProduct} className="p-6 border border-neutral-200 bg-neutral-50 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Title</label>
                <input type="text" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Price</label>
                <input type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" rows={2}></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Image URLs (comma separated)</label>
                <textarea value={newProduct.imageUrls} onChange={e => setNewProduct({...newProduct, imageUrls: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" rows={2} placeholder="https://..., https://..."></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">STL File URL</label>
                <input type="url" value={newProduct.fileUrl} onChange={e => setNewProduct({...newProduct, fileUrl: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Format (e.g. .STL)</label>
                <input type="text" value={newProduct.format} onChange={e => setNewProduct({...newProduct, format: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">License (e.g. Personal Hobby)</label>
                <input type="text" value={newProduct.license} onChange={e => setNewProduct({...newProduct, license: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Polygons (e.g. Standard)</label>
                <input type="text" value={newProduct.polygons} onChange={e => setNewProduct({...newProduct, polygons: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Print Ready (e.g. Yes)</label>
                <input type="text" value={newProduct.printReady} onChange={e => setNewProduct({...newProduct, printReady: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-white" />
              </div>
            </div>
            <button type="submit" className="w-full py-4 mt-2 bg-primary text-primary-fg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-colors">
              {editingProductId ? 'Update Product' : 'Save Product'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(p => (
            <div key={p.id} className="p-4 border border-neutral-200 bg-neutral-50 flex justify-between items-center group">
              <div>
                <p className="text-sm font-medium text-neutral-900">{p.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-neutral-500">${p.price.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${p.active ? 'border-green-200 bg-green-50 text-green-700' : 'border-neutral-200 bg-white text-neutral-500'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditProduct(p)}
                  className="text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleToggleProduct(p.id, p.active)}
                  className="text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 transition-colors"
                >
                  Toggle
                </button>
                {productToDelete === p.id ? (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => confirmDeleteProduct(p.id)}
                      className="text-[10px] font-bold uppercase tracking-widest border border-red-600 px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setProductToDelete(null)}
                      className="text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setProductToDelete(p.id)}
                    className="text-[10px] font-bold uppercase tracking-widest border border-red-200 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Orders</h2>
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="p-6 border border-neutral-200 bg-neutral-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-900 mb-1">{o.customerEmail}</p>
                <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                  <span><strong className="text-neutral-900 font-medium">Tag:</strong> {o.cashAppTag}</span>
                  {o.total && <span><strong className="text-neutral-900 font-medium">Total:</strong> ${o.total.toFixed(2)}</span>}
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  <strong className="text-neutral-900 font-medium">Items:</strong>{' '}
                  {o.items ? o.items.map((i: any) => i.title).join(', ') : o.productId}
                </div>
                <div className="mt-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${o.status === 'approved' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    {o.status}
                  </span>
                </div>
              </div>
              {o.status === 'pending' && (
                orderToApprove === o.id ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => confirmApproveOrder(o)}
                      className="w-full md:w-auto bg-green-600 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setOrderToApprove(null)}
                      className="w-full md:w-auto bg-white border border-neutral-200 text-neutral-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setOrderToApprove(o.id)}
                    className="w-full md:w-auto bg-primary text-primary-fg px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-colors"
                  >
                    Approve & Send
                  </button>
                )
              )}
            </div>
          ))}
          {orders.length === 0 && (
             <div className="p-8 border border-neutral-200 border-dashed text-center bg-white">
               <p className="text-[10px] text-neutral-500 uppercase tracking-widest">No orders yet</p>
             </div>
          )}
        </div>
      </section>
    </div>
  );
}
