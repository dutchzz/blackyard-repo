import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useStore(state => state.cart);
  const clearCart = useStore(state => state.clearCart);
  const removeFromCart = useStore(state => state.removeFromCart);
  const isOver18 = useStore(state => state.isOver18);
  const setIsOver18 = useStore(state => state.setIsOver18);
  
  const [email, setEmail] = useState('');
  const [cashTag, setCashTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  if (cart.length === 0 && !success) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center space-y-6 py-24 px-4">
        <div className="w-20 h-20 bg-neutral-50 border border-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-light tracking-tight text-neutral-900">Your cart is empty</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Looks like you haven't added any files to your cart yet. Browse our selection and add items to begin checkout.
        </p>
        <div className="pt-4">
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-primary text-primary-fg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors"
          >
            Browse Files
          </button>
        </div>
      </motion.div>
    );
  }

  if (!isOver18) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center space-y-8 py-20">
        <div className="w-12 h-12 border border-neutral-200 bg-neutral-50 flex items-center justify-center mx-auto mb-6">
           <span className="text-xs font-bold text-neutral-900">18+</span>
        </div>
        <h2 className="text-2xl font-light tracking-tight text-neutral-900">18+ Verification</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          These are legal firearm parts for personal hobby projects. You must be 18 years or older to purchase.
        </p>
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => setIsOver18(true)}
            className="w-full py-4 bg-primary text-primary-fg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors"
          >
            I am 18 or older
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 border border-neutral-200 bg-white text-neutral-900 text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 transition-colors"
          >
            I am under 18
          </button>
        </div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center space-y-6 py-20">
        <div className="w-16 h-16 border border-neutral-200 bg-neutral-50 flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-2xl font-light tracking-tight text-neutral-900">Order Request Received</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Please ensure you have sent <strong className="text-primary">${cartTotal.toFixed(2)}</strong> to Cash App tag <strong className="text-primary">$nwocomingsoon</strong>.
        </p>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Once we verify your payment, an automated email will be sent to <strong className="text-primary">{email}</strong> with your digital download links.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 w-full py-4 border border-neutral-200 bg-white text-neutral-900 text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 transition-colors"
        >
          Return Home
        </button>
      </motion.div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !cashTag || cart.length === 0) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        items: cart,
        total: cartTotal,
        customerEmail: email,
        cashAppTag: cashTag,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      clearCart();
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit order request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto py-10">
      <div className="bg-white p-8 md:p-10 border border-neutral-200">
        <h2 className="text-2xl font-light tracking-tight text-neutral-900 mb-8">Checkout</h2>
        
        <div className="mb-8 space-y-4">
          {cart.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex justify-between items-center py-4 border-b border-neutral-200 last:border-0">
              <div>
                <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">Digital Download</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-neutral-900">${item.price.toFixed(2)}</p>
                <button onClick={() => removeFromCart(item.id)} className="text-neutral-400 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-end pt-4 border-t border-neutral-900">
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-900">Total</p>
            <p className="text-xl font-bold text-neutral-900">${cartTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="border border-neutral-200 bg-neutral-50 p-6 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-neutral-900">Payment Instructions:</p>
          <ol className="list-decimal pl-4 space-y-2 text-sm text-neutral-600">
            <li>Send exactly <strong className="text-primary">${cartTotal.toFixed(2)}</strong> via Cash App to <strong className="text-primary">$nwocomingsoon</strong>.</li>
            <li>Fill out the form below with the exact Cash Tag you paid from.</li>
            <li>Submit your request. Your file will be emailed upon verification.</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Email Address (For Delivery)</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-neutral-50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Your Cash App Tag</label>
            <input 
              type="text" 
              required
              value={cashTag}
              onChange={(e) => setCashTag(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:border-primary text-sm bg-neutral-50"
              placeholder="$YourCashTag"
            />
          </div>
          
          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-primary text-primary-fg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors disabled:opacity-50 mt-4"
          >
            {submitting ? 'Submitting...' : 'Submit Order Request'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
