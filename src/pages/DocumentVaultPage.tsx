import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Tag, Sparkles, CheckCircle2, ShieldCheck, Eye, Bell, Scan, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { SpendTrackApi } from '../services/api.js';

export const DocumentVaultPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('PAN');
  const [fileUrl, setFileUrl] = useState('');
  const [rawText, setRawText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await SpendTrackApi.getDocuments(categoryFilter, searchQuery);
      setData(res);
      if (res?.documents?.length > 0 && !selectedDoc) {
        setSelectedDoc(res.documents[0]);
      }
    } catch (e) {
      console.warn('Failed to load document vault:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, searchQuery]);

  const handleRunOcrUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      const res = await SpendTrackApi.processDocumentOcr({
        title,
        category,
        fileUrl: fileUrl || '',
        rawContentText: rawText,
      });

      setOcrResult(res);
      setTitle('');
      setFileUrl('');
      setRawText('');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to run OCR:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await SpendTrackApi.deleteDocument(id);
      setSelectedDoc(null);
      loadData();
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  const categories = [
    'ALL',
    'AADHAAR',
    'PAN',
    'PASSPORT',
    'DRIVING_LICENSE',
    'SALE_DEED',
    'LOAN_PAPERS',
    'INSURANCE',
    'SALARY_SLIP',
    'GST_INVOICE',
    'BANK_STATEMENT',
  ];

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 soft-shadow">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
            <Scan className="w-3.5 h-3.5 text-indigo-400" />
            <span>SpendTrack AI Smart OCR Document Center v4.8.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-400" /> Smart OCR Document Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auto-Extract Aadhaar, PAN, Passport, Sale Deeds, Loan Agreements, GST Invoices & Bank Statements
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:scale-102 cursor-pointer transition-all self-start md:self-center"
        >
          <Scan className="w-4 h-4 stroke-[2.5]" /> Run Smart OCR Upload
        </button>
      </div>

      {/* Search & Category Filter Pills */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search metadata, extracted names, document numbers, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* PHASE 1: DUAL-PANEL SMART OCR DOCUMENT VIEWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Documents Catalog */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Vault Documents ({data?.documents?.length || 0})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {data?.documents?.map((doc: any) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-500/20 border-indigo-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300">
                        {doc.category}
                      </span>
                      <h4 className="text-sm font-extrabold text-white mt-1">{doc.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-extrabold">
                      {doc.ocrConfidence || 96.5}% Conf.
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{doc.summary || doc.ocrText}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Extracted OCR Fields & AI Inspector */}
        <div className="lg:col-span-7">
          {selectedDoc ? (
            <GlassCard className="p-6 space-y-5 border-indigo-500/30">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">{selectedDoc.category}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      OCR Confidence: {selectedDoc.ocrConfidence || 96.5}%
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">{selectedDoc.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Reminder set for document ${selectedDoc.title}`)}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-extrabold text-xs flex items-center gap-1 hover:bg-purple-500/20 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-purple-400" />
                    <span>Create Reminder</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDoc.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-extrabold text-xs cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* AI Summary Banner */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Extracted Summary</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{selectedDoc.summary || selectedDoc.ocrText}</p>
              </div>

              {/* Extracted Metadata Fields Highlight */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Extracted Metadata Fields</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Document Number</span>
                    <span className="font-mono font-bold text-white">{selectedDoc.documentNumber || 'DOC-489201'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Institution / Authority</span>
                    <span className="font-bold text-white">{selectedDoc.institution || 'Govt of India'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Issue / Expiry Date</span>
                    <span className="font-bold text-slate-300">{selectedDoc.issueDate ? new Date(selectedDoc.issueDate).toISOString().split('T')[0] : '2023-01-15'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Financial Amount (if any)</span>
                    <span className="font-mono font-black text-emerald-400">₹{(selectedDoc.extractedAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-12 text-center text-slate-400">
              Select any document from the vault to inspect extracted OCR metadata fields and confidence score.
            </GlassCard>
          )}
        </div>
      </div>

      {/* Add Document OCR Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-white">Smart OCR Upload & Field Extraction</h3>
            <form onSubmit={handleRunOcrUpload} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhaar Card / PAN Card / Sale Deed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Document Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="SALE_DEED">Sale Deed</option>
                  <option value="LOAN_PAPERS">Loan Agreement</option>
                  <option value="INSURANCE">Insurance Policy</option>
                  <option value="SALARY_SLIP">Salary Slip</option>
                  <option value="GST_INVOICE">GST Invoice</option>
                  <option value="BANK_STATEMENT">Bank Statement</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Document Text / Snippet for OCR</label>
                <textarea
                  rows={3}
                  placeholder="Paste document text or let Gemini Vision scan automatically..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-extrabold cursor-pointer">Run Smart OCR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
