"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Upload,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  DollarSign,
  Link2,
  Image,
  X,
} from "lucide-react";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  link: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface Props {
  companyId: string | undefined;
}

export default function CatalogTab({ companyId }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Add single item modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addLink, setAddLink] = useState("");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [adding, setAdding] = useState(false);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const fetchItems = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ companyId });
      if (search.trim()) params.set("search", search.trim());
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/catalog?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
    setLoading(false);
  }, [companyId, search, categoryFilter]);

  useEffect(() => {
    if (companyId) fetchItems();
  }, [fetchItems, companyId]);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/catalog?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !companyId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          name: addName.trim(),
          description: addDesc.trim() || null,
          price: addPrice ? parseFloat(addPrice) : null,
          category: addCategory.trim() || null,
          link: addLink.trim() || null,
          imageUrl: addImageUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.item) {
        setItems((prev) => [data.item, ...prev]);
        setShowAdd(false);
        setAddName("");
        setAddDesc("");
        setAddPrice("");
        setAddCategory("");
        setAddLink("");
        setAddImageUrl("");
      }
    } catch {}
    setAdding(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    setUploading(true);
    setUploadResult(null);
    setUploadErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", companyId);

      const res = await fetch("/api/catalog/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.created > 0) {
        setUploadResult(`✅ Imported ${data.created} products`);
        fetchItems();
      }
      if (data.errors && data.errors.length > 0) {
        setUploadErrors(data.errors.slice(0, 10));
      }
    } catch {
      setUploadResult("❌ Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  // Get unique categories from items
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))] as string[];

  const filtered = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && i.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-48 pl-9 pr-3 py-2 rounded-xl text-xs bg-black border border-white/5 text-white placeholder-[white/40] focus:outline-none focus:border-violet-400/50 transition-all"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-black border border-white/5 text-white focus:outline-none focus:border-violet-400/50 transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer bg-white/[0.02] border border-white/5 hover:border-violet-400/50 hover:text-violet-400 transition-all text-white/40">
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading..." : "Import CSV/XLSX"}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-violet-400 text-black hover:bg-violet-400/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>
          <button onClick={fetchItems} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5/50 transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upload result */}
      {uploadResult && (
        <div className="px-4 py-2 rounded-lg text-xs bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-2">
          {uploadResult}
        </div>
      )}
      {uploadErrors.length > 0 && (
        <div className="px-4 py-2 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20">
          {uploadErrors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-xl border border-white/5 bg-white/[0.02] text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-white/40" />
          </div>
          <p className="text-sm text-white/40">
            {search || categoryFilter ? "No matching products" : "No products yet"}
          </p>
          <p className="text-xs text-white/40 mt-1">
            Upload a CSV/XLSX file or add products manually
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-violet-400/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate">{item.name}</h4>
                    {item.category && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 uppercase tracking-wider shrink-0">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {item.price != null && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-violet-400">
                        <DollarSign className="w-3 h-3" />
                        {item.price.toFixed(2)}
                      </div>
                    )}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline">
                        <Link2 className="w-2.5 h-2.5" />
                        Link
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add product modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl border border-white/5 bg-white/[0.02] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Product</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-white/5/50 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={addItem} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Name *</label>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} required placeholder="Product name" className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-[white/40] focus:outline-none focus:border-violet-400/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Description</label>
                <textarea value={addDesc} onChange={(e) => setAddDesc(e.target.value)} placeholder="Product description" rows={3} className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-[white/40] focus:outline-none focus:border-violet-400/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Price</label>
                  <input value={addPrice} onChange={(e) => setAddPrice(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00" className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-[white/40] focus:outline-none focus:border-violet-400/50" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Category</label>
                  <input value={addCategory} onChange={(e) => setAddCategory(e.target.value)} placeholder="e.g. Electronics" className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-[white/40] focus:outline-none focus:border-violet-400/50" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Link</label>
                <input value={addLink} onChange={(e) => setAddLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-[white/40] focus:outline-none focus:border-violet-400/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Image URL</label>
                <input value={addImageUrl} onChange={(e) => setAddImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-xl text-sm bg-black border border-white/5 text-white placeholder-[white/40] focus:outline-none focus:border-violet-400/50" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-xs font-medium border border-white/5 text-white/40 hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={adding} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-violet-400 text-black hover:bg-violet-400/90 disabled:opacity-50 transition-all">
                  {adding ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
