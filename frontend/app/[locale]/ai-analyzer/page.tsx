"use client";

import { useState, useRef, ChangeEvent } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTranslations } from "next-intl";

// ─── Types ───────────────────────────────────────────────
interface AnalysisData {
  personal_summary: string;
  medical_history: string[];
  nutritional_habits: string[];
  psychological_plan: string[];
  environmental_factors: string[];
  recommended_activities: string[];
}

interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error" | "info";
}

// ─── Toast ───────────────────────────────────────────────
function Toast({ toast }: { toast: ToastState }) {
  if (!toast.visible) return null;
  const colors = { success: "bg-green-600", error: "bg-red-600", info: "bg-gray-700" };
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white shadow-lg z-50 ${colors[toast.type]}`}>
      {toast.message}
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-black/60 border border-red-900/40 rounded-2xl overflow-hidden hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all">
      <div className="px-5 py-3 border-b border-red-900/40 text-red-400 font-bold text-sm">{title}</div>
      <div className="p-5 text-white/80 text-sm space-y-2">{children}</div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────
export default function AIAnalyzer() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const t = useTranslations("aiAnalyzer.toast");

  const [file, setFile]   = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData]   = useState<AnalysisData | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", type: "success" });
  const printRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: ToastState["type"] = "success") => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".docx")) { showToast("ارفع ملف Word بس", "error"); return; }
    setFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setData(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const apiUrl = typeof window === "undefined"
        ? (process.env.INTERNAL_API_URL || "http://app:3000")
        : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");
        
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/analyze`, { 
        method: "POST", 
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (res.status === 403) {
        throw new Error(t("subscriptionRequired"));
      }
      if (!res.ok) throw new Error(result.error);
      setData(result.data);
      showToast("تم التحليل بنجاح");
    } catch (err: any) {
      showToast(err.message || "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(img, "PNG", 0, 0, 210, 295);
    pdf.save("analysis.pdf");
  };

  // ── Auth guard: show spinner while checking, redirect if not logged in ──
  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="min-h-screen bg-black text-white px-6 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-2">AI Coach Analyst</h1>
          <p className="text-white/50">تحليل ذكي للاعبين</p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">

          {/* Step 1: Download */}
          <div className="bg-black/70 border border-blue-900/40 p-8 rounded-3xl text-center hover:border-blue-500/50 transition">
            <div className="mb-4 flex justify-center text-blue-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-10 h-10">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">الخطوة الأولى</h3>
            <p className="text-white/60 text-sm mb-6">قم بتحميل نموذج التقييم لتعبئته ببيانات اللاعب.</p>
            <a
              href="/assets/player-data-template.docx"
              download
              className="inline-block px-8 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-500 transition shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              تحميل النموذج (Word)
            </a>
          </div>

          {/* Step 2: Upload */}
          <div className="bg-black/70 border border-red-900/40 p-8 rounded-3xl text-center hover:border-red-500/50 transition">
            <div className="mb-4 flex justify-center text-red-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-10 h-10">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">الخطوة الثانية</h3>
            <p className="text-white/60 text-sm mb-6">ارفع النموذج بعد تعبئته ليقوم الذكاء الاصطناعي بتحليله.</p>

            <label className="block max-w-xs mx-auto mb-4 border-2 border-dashed border-red-900/50 rounded-xl p-4 cursor-pointer hover:border-red-500 transition">
              <span className="block text-red-500">{file ? file.name : "اختر الملف من جهازك"}</span>
              <input type="file" accept=".docx" onChange={handleFile} className="hidden" />
            </label>

            <button
              onClick={analyze}
              disabled={!file || loading}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            >
              {loading ? "جاري التحليل..." : "بدء التحليل"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center text-red-400 font-bold animate-pulse">جاري التحليل...</div>
        )}

        {/* Results */}
        {data && (
          <div className="mt-10 space-y-6" ref={printRef}>
            <div className="grid md:grid-cols-2 gap-4">
              <Card title="ملخص الحالة">{data.personal_summary}</Card>
              <Card title="التاريخ المرضي">{data.medical_history.map((i, idx) => <p key={idx}>• {i}</p>)}</Card>
              <Card title="العادات الغذائية">{data.nutritional_habits.map((i, idx) => <p key={idx}>• {i}</p>)}</Card>
              <Card title="الخطة النفسية">{data.psychological_plan.map((i, idx) => <p key={idx}>• {i}</p>)}</Card>
              <Card title="البيئة">{data.environmental_factors.map((i, idx) => <p key={idx}>• {i}</p>)}</Card>
              <Card title="التوصيات">{data.recommended_activities.map((i, idx) => <p key={idx}>• {i}</p>)}</Card>
            </div>

            <button
              onClick={downloadPDF}
              className="mt-6 px-6 py-3 bg-green-600 rounded-xl font-bold hover:bg-green-500"
            >
              تحميل PDF
            </button>
          </div>
        )}

      </div>
    </>
  );
}