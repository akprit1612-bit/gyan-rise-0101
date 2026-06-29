import React, { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useParams, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DigitalPdfViewer() {
  const { pdfId } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // request preview which enforces purchase and proxies PDF
        const res = await api.get(`/digital-store/preview/${pdfId}`, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to load PDF';
        toast.error(msg);
        navigate(-1);
      } finally { setLoading(false); }
    };
    fetch();
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [pdfId]);

  if (loading) return <Skeleton className="h-screen w-full" />;
  return (
    <div className="h-screen">
      <div className="p-2 bg-white border-b">
        <Button onClick={() => navigate(-1)}>Back</Button>
        {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-2 no-underline">Open in new tab</a>}
      </div>
      {pdfUrl ? (
        <iframe src={pdfUrl} className="w-full h-[calc(100vh-56px)]" title="PDF viewer" sandbox="allow-scripts allow-same-origin"></iframe>
      ) : (
        <div className="p-4">Unable to load PDF.</div>
      )}
    </div>
  );
}
