import React, { useEffect, useState } from "react";
import { api, resolveImage } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function StudentDigitalStore() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/digital-store"); setItems(data); } catch (e) { toast.error("Failed to load store"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const buy = async (id) => {
    try {
      const { data } = await api.post(`/digital-store/checkout/${id}`);
      // frontend should use Razorpay checkout; for simplicity open new tab to handle payment flow
      if (data?.order && data?.key_id) {
        // store order info in sessionStorage for verifier page
        sessionStorage.setItem("razorpay_order", JSON.stringify({ order: data.order, key_id: data.key_id, pdf_id: id }));
        window.location.href = `/checkout?pdf_id=${id}`;
      } else {
        toast.error("Checkout failed");
      }
    } catch (err) { toast.error("Checkout failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-[#1D4ED8]">Store</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter text-slate-900 mt-1">Digital Store</h1>
        <p className="text-slate-500 mt-2 text-sm">Browse and purchase PDFs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length:6}).map((_,i)=>(<div key={i} className="h-48 bg-slate-100 animate-pulse"/>)) : (
          items.map(it => (
            <div key={it.id} className="bg-white border rounded-lg p-4">
              {it.thumbnail_url && <img src={resolveImage(it.thumbnail_url)} alt="thumb" className="h-36 w-full object-cover rounded-md mb-2" />}
              <div className="font-medium text-slate-900">{it.title}</div>
              <div className="text-sm text-slate-500">{it.category}</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-lg font-semibold">{(it.price || 0) > 0 ? `${it.currency || 'INR'} ${it.price}` : 'Free'}</div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => navigate(`/store/view/${it.id}`)}>View</Button>
                  <Button onClick={() => buy(it.id)} className="bg-[#1D4ED8] text-white">Buy Now</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
