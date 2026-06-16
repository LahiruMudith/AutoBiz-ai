'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icons from '../../../components/ui/icons';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  images?: string[]; // base64 data URLs
}

const CATEGORIES = ['Shirts', 'Dresses', 'Jackets', 'Trousers', 'Accessories', 'Shoes', 'Bags', 'Other'];

// ─── Tiny image compressor ──────────────────────────────────────────────────
function compressImage(file: File, maxW = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxW / img.width, 1);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── ImageUploader sub-component ────────────────────────────────────────────
function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 3 - images.length;
    const picked = Array.from(files).slice(0, remaining);
    if (!picked.length) return;
    setUploading(true);
    const compressed = await Promise.all(picked.map((f) => compressImage(f)));
    onChange([...images, ...compressed]);
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Thumbnails row */}
      <div className="flex gap-2 flex-wrap">
        {images.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 group">
            <img src={src} alt={`img-${i}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 w-5 h-5 bg-rose-600/90 hover:bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}

        {images.length < 3 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400" />
            ) : (
              <>
                <Icons.Plus size={16} />
                <span className="text-[9px] mt-0.5 font-bold">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-[9px] text-slate-500">
        {images.length}/3 images uploaded · JPG/PNG · auto-compressed
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── ProductFormModal ────────────────────────────────────────────────────────
function ProductFormModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: 'add' | 'edit';
  initial?: Product;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price?.toString() ?? '');
  const [stock, setStock] = useState(initial?.stock?.toString() ?? '');
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, price: Number(price), stock: Number(stock), category, description, images });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 text-left shadow-2xl max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="font-bold text-base text-white">
            {mode === 'add' ? 'Add New Product' : 'Edit Product'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'add'
              ? 'Fill in the details to add to your AI product catalog'
              : 'Modify product information'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Product Images */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400">PRODUCT IMAGES (MAX 3)</label>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          {/* Name */}
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

          {/* Price & Stock */}
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
              <label className="text-[10px] font-bold text-slate-400">STOCK QTY</label>
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

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400">CATEGORY</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition-all"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400">DESCRIPTION (AI CONTEXT)</label>
            <textarea
              placeholder="Colors, sizes, materials — the AI uses this when answering customers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-20 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none transition-all"
            />
          </div>

          <div className="flex gap-3 justify-end border-t border-slate-950 pt-4 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/15 transition-all"
            >
              {mode === 'add' ? 'Add Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ imgs: string[]; idx: number } | null>(null);

  useEffect(() => {
    const bizId = localStorage.getItem('selectedBusinessId') || 'demo-clothing-store';
    setBusinessId(bizId);
    fetchProducts(bizId);
  }, []);

  const fetchProducts = async (bizId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/products`);
      if (res.ok) setProducts(await res.json());
    } catch {
      setProducts([
        { id: '1', name: 'Slim Fit Cotton Shirt', price: 3450, stock: 15, category: 'Shirts', description: 'Premium cotton slim fit shirt.', images: [] },
        { id: '2', name: 'Linen Casual Shirt', price: 2900, stock: 8, category: 'Shirts', description: 'Breathable linen shirt.', images: [] },
        { id: '3', name: 'Floral Summer Dress', price: 4200, stock: 12, category: 'Dresses', description: 'Flowy floral dress.', images: [] },
        { id: '4', name: 'Denim Jacket Classic', price: 5900, stock: 5, category: 'Jackets', description: 'Distressed blue denim jacket.', images: [] },
        { id: '5', name: 'Chino Trousers', price: 3800, stock: 0, category: 'Trousers', description: 'Stretch chino trousers.', images: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data: Omit<Product, 'id'>) => {
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) fetchProducts(businessId);
    } catch {
      setProducts((prev) => [...prev, { id: Math.random().toString(36).slice(2), ...data }]);
    }
    setShowAddModal(false);
  };

  const handleEdit = async (data: Omit<Product, 'id'>) => {
    if (!editProduct) return;
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${businessId}/products/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) fetchProducts(businessId);
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? { ...p, ...data } : p)));
    }
    setEditProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await fetch(`http://localhost:5000/api/businesses/${businessId}/products/${id}`, { method: 'DELETE' });
      fetchProducts(businessId);
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Package size={20} className="text-indigo-400" />
            Product Catalog
          </h2>
          <p className="text-xs text-slate-400">
            Manage products shown to customers by the AI Sales Agent · Images upload up to 3 per product
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 transition-all"
        >
          <Icons.Plus size={16} />
          Add New Product
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const outOfStock = p.stock === 0;
            const imgs = p.images ?? [];

            return (
              <div
                key={p.id}
                className="bg-slate-900/40 border border-slate-900 rounded-2xl flex flex-col overflow-hidden hover:border-slate-800 transition-all group"
              >
                {/* Image Gallery */}
                <div className="relative h-40 bg-slate-950 overflow-hidden">
                  {imgs.length > 0 ? (
                    <div className="flex h-full">
                      {imgs.slice(0, 3).map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setLightbox({ imgs, idx: i })}
                          className={`h-full flex-1 overflow-hidden ${imgs.length > 1 ? 'border-r border-slate-800/50 last:border-0' : ''}`}
                        >
                          <img
                            src={src}
                            alt={`${p.name} ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700">
                      <Icons.Package size={32} />
                      <span className="text-[10px] mt-2 font-medium">No images</span>
                    </div>
                  )}

                  {outOfStock && (
                    <div className="absolute top-2 right-2 bg-rose-950/90 border border-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                      Out of Stock
                    </div>
                  )}

                  {imgs.length > 0 && (
                    <div className="absolute bottom-1.5 right-2 flex gap-1">
                      {imgs.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{p.category}</span>
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-950 pt-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block">PRICE</span>
                      <span className="text-sm font-extrabold text-white">LKR {p.price.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-500 block">STOCK</span>
                      <span className={`text-xs font-bold ${outOfStock ? 'text-rose-500' : p.stock < 5 ? 'text-amber-500' : 'text-slate-200'}`}>
                        {p.stock} units
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-950/50 pt-2.5">
                    <button
                      onClick={() => setEditProduct(p)}
                      className="flex-1 py-1.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Icons.Edit size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2.5 py-1.5 bg-slate-800/20 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    >
                      <Icons.Trash size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <ProductFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
        />
      )}

      {/* Edit Modal */}
      {editProduct && (
        <ProductFormModal
          mode="edit"
          initial={editProduct}
          onClose={() => setEditProduct(null)}
          onSave={handleEdit}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.imgs[lightbox.idx]}
              alt="product"
              className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />

            {lightbox.imgs.length > 1 && (
              <div className="flex gap-3 justify-center mt-4">
                {lightbox.imgs.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox({ ...lightbox, idx: i })}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === lightbox.idx ? 'border-indigo-400' : 'border-slate-700 opacity-60'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-white font-bold text-sm flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
