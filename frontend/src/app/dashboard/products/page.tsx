'use client';

import React, { useState, useEffect } from 'react';
import Icons from '../../../components/ui/icons';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Shirts');
  const [description, setDescription] = useState('');

  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    const bizId = localStorage.getItem('selectedBusinessId') || 'demo-clothing-store';
    setBusinessId(bizId);
    fetchProducts(bizId);
  }, []);

  const fetchProducts = async (bizId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.warn('Fallback to local products');
      setProducts([
        { id: '1', name: 'Slim Fit Cotton Shirt', price: 3450, stock: 15, category: 'Shirts', description: 'Premium 100% cotton slim fit formal shirt.' },
        { id: '2', name: 'Linen Casual Shirt', price: 2900, stock: 8, category: 'Shirts', description: 'Breathable linen casual shirt perfect for summer.' },
        { id: '3', name: 'Floral Summer Dress', price: 4200, stock: 12, category: 'Dresses', description: 'Flowy floral printed dress with waist belt.' },
        { id: '4', name: 'Denim Jacket Classic', price: 5900, stock: 5, category: 'Jackets', description: 'Distressed blue denim jacket.' },
        { id: '5', name: 'Chino Trousers', price: 3800, stock: 0, category: 'Trousers', description: 'Stretch chino trousers in Khaki.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setName('');
    setPrice('');
    setStock('');
    setCategory('Shirts');
    setDescription('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setCurrentProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setCategory(p.category);
    setDescription(p.description);
    setShowEditModal(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock) return;

    const newProd = {
      name,
      price: Number(price),
      stock: Number(stock),
      category,
      description
    };

    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchProducts(businessId);
      }
    } catch (err) {
      // Local state update fallback
      const mockProd: Product = { id: Math.random().toString(), ...newProd };
      setProducts([...products, mockProd]);
      setShowAddModal(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || !name || !price || !stock) return;

    const updatedProd = {
      name,
      price: Number(price),
      stock: Number(stock),
      category,
      description
    };

    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${businessId}/products/${currentProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProd)
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchProducts(businessId);
      }
    } catch (err) {
      // Local state update fallback
      setProducts(products.map(p => p.id === currentProduct.id ? { ...p, ...updatedProd } : p));
      setShowEditModal(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${businessId}/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProducts(businessId);
      }
    } catch (err) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Package size={20} className="text-indigo-400" />
            Product Catalog
          </h2>
          <p className="text-xs text-slate-400">Manage products recommended to customers by the AI Sales Agent</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 transition-all"
        >
          <Icons.Plus size={16} />
          Add New Product
        </button>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const isOutOfStock = p.stock === 0;
            return (
              <div
                key={p.id}
                className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-800 transition-all relative overflow-hidden group"
              >
                {/* Out of Stock Ribbon Overlay */}
                {isOutOfStock && (
                  <div className="absolute top-2 right-2 bg-rose-950/80 border border-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Out of Stock
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {p.category}
                  </span>
                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-950 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500">PRICE</span>
                    <span className="text-sm font-extrabold text-white">LKR {p.price.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-500">STOCK</span>
                    <span className={`text-xs font-bold ${isOutOfStock ? 'text-rose-500' : p.stock < 5 ? 'text-amber-500' : 'text-slate-200'}`}>
                      {p.stock} units
                    </span>
                  </div>
                </div>

                {/* Edit/Delete Actions */}
                <div className="flex gap-2 border-t border-slate-950/50 pt-2.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="flex-1 py-1.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Icons.Edit size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="px-2.5 py-1.5 bg-slate-800/20 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Icons.Trash size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 text-left">
            <div>
              <h3 className="font-bold text-base text-white">Add Product</h3>
              <p className="text-xs text-slate-400">Fill in details to index in product catalog</p>
            </div>

            <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">PRODUCT NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Slim Fit Cotton Shirt"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400">PRICE (LKR)</label>
                  <input
                    type="number"
                    placeholder="3450"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400">INITIAL STOCK</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">CATEGORY</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition-all"
                >
                  <option value="Shirts">Shirts</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Jackets">Jackets</option>
                  <option value="Trousers">Trousers</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">DESCRIPTION (AI CONTEXT)</label>
                <textarea
                  placeholder="Provide keywords, colors, sizes, or materials for the AI agent..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-950 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/15 transition-all"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 text-left">
            <div>
              <h3 className="font-bold text-base text-white">Edit Product</h3>
              <p className="text-xs text-slate-400">Modify properties of the selected product</p>
            </div>

            <form onSubmit={handleEditProduct} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">PRODUCT NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400">PRICE (LKR)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400">STOCK LEVEL</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">CATEGORY</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition-all"
                >
                  <option value="Shirts">Shirts</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Jackets">Jackets</option>
                  <option value="Trousers">Trousers</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">DESCRIPTION (AI CONTEXT)</label>
                <textarea
                  placeholder="Provide keywords, colors, sizes, or materials for the AI agent..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-950 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/15 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
