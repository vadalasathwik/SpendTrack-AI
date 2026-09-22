import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { BRAND_NAME } from '../constants/brand.js';

interface TermsProps {
  onBack: () => void;
}

export const Terms: React.FC<TermsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {BRAND_NAME} Terms of Service • Effective September 2026
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="space-y-8 text-slate-600 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">1. Service Description</h2>
            <p>
              {BRAND_NAME} provides personal finance tracking, budget management, category management, AI-driven receipt scanning via Gemini Vision, and spending analytics backed by PostgreSQL and Prisma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">2. Acceptable Use Policy</h2>
            <p className="mb-3">
              By using {BRAND_NAME}, you agree to comply with all applicable local, national, and international laws and regulations. Acceptable use includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 font-medium">
              <li>Using the application solely for personal, non-commercial, or legitimate household finance tracking purposes.</li>
              <li>Maintaining the security of your Google account credentials and restricting unauthorized access to your devices.</li>
              <li>Refraining from attempting to probe, scan, compromise, or reverse engineer any part of the application infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">3. User Data Ownership</h2>
            <p>
              You retain full ownership of all financial records and data processed using {BRAND_NAME}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">4. Disclaimer of Warranties & Limitation of Liability</h2>
            <div className="space-y-3 bg-slate-100/80 p-5 rounded-2xl border border-slate-200 text-slate-700 font-medium">
              <p>
                <strong>AS-IS Provision:</strong> {BRAND_NAME} is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind.
              </p>
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">5. Contact Information</h2>
            <p className="text-sm">
              For any questions regarding these Terms of Service, please contact our support team at:
            </p>
            <p className="mt-2 font-bold text-emerald-800 text-sm">
              Email: support@spendtrack.ai
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};