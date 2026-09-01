import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  fileUrl: string;
  active: boolean;
  format?: string;
  license?: string;
  polygons?: string;
  printReady?: string;
}

function getDirectImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
  }
  return url;
}

const ZoomableImage = ({ src, alt }: { src: string, alt: string }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden cursor-zoom-in flex items-center justify-center"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={src} 
        alt={alt} 
        className={`object-contain w-full h-full mix-blend-multiply transition-transform duration-200 ease-out ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
        style={{ 
          transformOrigin: isZoomed ? `${position.x}% ${position.y}%` : 'center center'
        }}
      />
    </div>
  );
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const addToCart = useStore(state => state.addToCart);

  useEffect(() => {
    if (selectedProduct) {
      setCurrentImageIndex(0);
    }
  }, [selectedProduct]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const q = query(collection(db, 'products'), where('active', '==', true));
        const snap = await getDocs(q);
        const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(prods);
      } catch (err) {
        console.error("Error loading products", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handlePurchase = (product: Product) => {
    addToCart({ id: product.id, title: product.title, price: product.price });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-neutral-900">Files</h1>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 border border-neutral-200 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Filter</div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex flex-col animate-pulse">
              <div className="aspect-[4/5] bg-neutral-100 border border-neutral-200"></div>
              <div className="mt-4 flex justify-between items-start">
                <div className="flex-1 pr-4 space-y-2.5">
                  <div className="h-4 bg-neutral-200 w-2/3"></div>
                  <div className="h-3 bg-neutral-200 w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8">
          <div className="group cursor-pointer" onClick={() => setSelectedProduct({ id: 'mock1', title: 'File 1', price: 24.00, description: 'STL File.', active: true, imageUrl: '', fileUrl: '' })}>
            <div className="aspect-[4/5] bg-neutral-100 border border-neutral-200 flex items-center justify-center relative">
              <span className="text-neutral-300 font-mono text-xs uppercase">Preview Image</span>
            </div>
            <div className="mt-3 flex justify-between items-start">
              <div>
                <div className="text-sm font-medium">File 1</div>
                <div className="text-xs text-neutral-500 mt-1">$24.00</div>
              </div>
              <button 
                onClick={() => handlePurchase({ id: 'mock1', title: 'File 1', price: 24.00, description: '', active: true, imageUrl: '', fileUrl: '' })}
                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-primary text-primary-fg text-[10px] font-bold uppercase tracking-widest transition-opacity"
              >
                Buy
              </button>
            </div>
          </div>
          
          <div className="group cursor-pointer" onClick={() => setSelectedProduct({ id: 'mock2', title: 'File 2', price: 12.00, description: 'STL File.', active: true, imageUrl: '', fileUrl: '' })}>
            <div className="aspect-[4/5] bg-neutral-100 border border-neutral-200 flex items-center justify-center">
              <span className="text-neutral-300 font-mono text-xs uppercase">Preview Image</span>
            </div>
            <div className="mt-3 flex justify-between items-start">
              <div>
                <div className="text-sm font-medium">File 2</div>
                <div className="text-xs text-neutral-500 mt-1">$12.00</div>
              </div>
              <button 
                onClick={() => handlePurchase({ id: 'mock2', title: 'File 2', price: 12.00, description: '', active: true, imageUrl: '', fileUrl: '' })}
                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-primary text-primary-fg text-[10px] font-bold uppercase tracking-widest transition-opacity"
              >
                Buy
              </button>
            </div>
          </div>

          <div className="group cursor-pointer" onClick={() => setSelectedProduct({ id: 'mock3', title: 'File 3', price: 18.00, description: 'STL File.', active: true, imageUrl: '', fileUrl: '' })}>
            <div className="aspect-[4/5] bg-neutral-100 border border-neutral-200 flex items-center justify-center">
              <span className="text-neutral-300 font-mono text-xs uppercase">Preview Image</span>
            </div>
            <div className="mt-3 flex justify-between items-start">
              <div>
                <div className="text-sm font-medium">File 3</div>
                <div className="text-xs text-neutral-500 mt-1">$18.00</div>
              </div>
              <button 
                onClick={() => handlePurchase({ id: 'mock3', title: 'File 3', price: 18.00, description: '', active: true, imageUrl: '', fileUrl: '' })}
                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-primary text-primary-fg text-[10px] font-bold uppercase tracking-widest transition-opacity"
              >
                Buy
              </button>
            </div>
          </div>

          <div className="group cursor-pointer opacity-50">
            <div className="aspect-[4/5] bg-neutral-100 border border-neutral-200 flex items-center justify-center relative">
              <span className="text-neutral-300 font-mono text-xs uppercase">Preview Image</span>
            </div>
            <div className="mt-3">
              <div className="text-sm font-medium text-neutral-400">File 4</div>
              <div className="text-xs text-neutral-400 mt-1">$15.00</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8">
          {products.map(product => (
            <motion.div 
              whileHover={{ y: -4 }}
              key={product.id} 
              className="group cursor-pointer flex flex-col"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-[4/5] bg-neutral-100 border border-neutral-200 overflow-hidden relative flex items-center justify-center">
                {(product.imageUrls?.[0] || product.imageUrl) ? (
                  <img src={getDirectImageUrl(product.imageUrls?.[0] || product.imageUrl)} alt={product.title} className="object-cover w-full h-full mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                ) : (
                  <span className="text-neutral-300 font-mono text-xs uppercase tracking-widest">No Thumbnail</span>
                )}
                {product.active && (
                   <div className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] font-bold border border-neutral-200 text-neutral-900 tracking-widest uppercase shadow-sm">Available</div>
                )}
              </div>
              
              <div className="mt-4 flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h3 className="text-sm font-semibold text-neutral-900 leading-tight">{product.title}</h3>
                  <p className="text-xs font-mono text-neutral-500 mt-1.5">{product.price === 0 ? 'FREE' : `$${product.price.toFixed(2)}`}</p>
                </div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (product.price === 0) {
                      window.open(product.fileUrl, '_blank');
                    } else {
                      handlePurchase(product);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 px-4 py-1.5 bg-primary text-primary-fg text-[10px] font-bold uppercase tracking-widest transition-opacity shrink-0"
                >
                  {product.price === 0 ? 'Download' : 'Add to Cart'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-white/80 backdrop-blur-sm"
              onClick={() => setSelectedProduct(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-4xl bg-white border border-neutral-200 shadow-2xl relative z-10 flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 hover:bg-neutral-50 z-20"
              >
                <span className="text-xs font-bold">X</span>
              </button>

              <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-neutral-100 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-200 relative p-4 md:p-8">
                <div className="w-full flex-1 relative flex items-center justify-center overflow-hidden">
                  {(selectedProduct.imageUrls?.[currentImageIndex] || selectedProduct.imageUrl) ? (
                    <ZoomableImage src={getDirectImageUrl(selectedProduct.imageUrls?.[currentImageIndex] || selectedProduct.imageUrl)} alt={selectedProduct.title} />
                  ) : (
                    <span className="text-neutral-300 font-mono text-xs uppercase tracking-widest">No Preview</span>
                  )}
                </div>
                {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto p-2 w-full justify-center">
                    {selectedProduct.imageUrls.map((url, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-12 h-12 border flex-shrink-0 ${currentImageIndex === idx ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      >
                        <img src={getDirectImageUrl(url)} className="w-full h-full object-cover mix-blend-multiply" alt={`Thumb ${idx}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
                <div className="mb-2">
                  <span className="px-2 py-1 bg-primary text-primary-fg text-[10px] font-bold uppercase tracking-widest">Available</span>
                </div>
                <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight leading-tight mt-4">{selectedProduct.title}</h2>
                <p className="text-lg font-mono text-neutral-500 mt-2">{selectedProduct.price === 0 ? 'FREE' : `$${selectedProduct.price.toFixed(2)}`}</p>
                
                <p className="text-sm text-neutral-600 mt-6 leading-relaxed">
                  {selectedProduct.description || 'STL file.'}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-8 border-y border-neutral-100 py-6">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">File Format</div>
                    <div className="text-sm font-medium mt-1">{selectedProduct.format || '.STL'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">License</div>
                    <div className="text-sm font-medium mt-1">{selectedProduct.license || 'Personal Hobby'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Polygons</div>
                    <div className="text-sm font-medium mt-1">{selectedProduct.polygons || 'Standard'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Print Ready</div>
                    <div className="text-sm font-medium mt-1">{selectedProduct.printReady || 'Yes'}</div>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  {selectedProduct.price === 0 ? (
                    <button 
                      onClick={() => {
                        window.open(selectedProduct.fileUrl, '_blank');
                      }}
                      className="w-full py-4 bg-primary text-primary-fg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors"
                    >
                      Download Free File
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          handlePurchase(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        className="w-full py-4 bg-primary text-primary-fg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors"
                      >
                        Add to Cart
                      </button>
                      <p className="text-center text-[10px] text-neutral-400 uppercase tracking-widest mt-4">
                        Instant Download via Email
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
