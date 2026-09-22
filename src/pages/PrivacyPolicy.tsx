import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { BRAND_NAME } from '../constants/brand.js';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {BRAND_NAME} Privacy Policy & Data Protections • Effective September 2026
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

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 font-medium">
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Overview</h2>
            <p>
              At {BRAND_NAME}, we value your trust and are committed to protecting your personal and financial privacy. {BRAND_NAME} is built on a modern PostgreSQL database architecture backed by Prisma, ensuring high security and data isolation for every user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-3 text-slate-700 font-medium">
              <li>
                <strong>Google Sign-In Authentication:</strong> We use Google OAuth 2.0 strictly to securely authenticate your identity (profile name and email address) without storing passwords.
              </li>
              <li>
                <strong>PostgreSQL Database Storage:</strong> Your expense records, category structures, and monthly budget settings are stored in a dedicated PostgreSQL database. All queries are strictly scoped to your authenticated user account.
              </li>
              <li>
                <strong>Receipt Scanning with Gemini AI:</strong> Receipt images are processed using Google Gemini AI models to automatically extract merchant name, transaction date, line items, and payment totals.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">How We Use Your Data</h2>
            <p>
              Your data is used exclusively to deliver the functionality of {BRAND_NAME}: storing financial records, tracking budgets, calculating category totals, and serving real-time AI spending insights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Data Sharing & Third Parties</h2>
            <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-950 font-bold">
              {BRAND_NAME} does not sell, rent, trade, or share your personal data or financial information with third parties or advertisers.
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Google API Limited Use Compliance</h2>
            <div className="p-5 bg-slate-100/80 border border-slate-200 rounded-2xl text-slate-800 font-semibold italic">
              {BRAND_NAME}'s use and transfer to any other app of information received from Google OAuth will adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline font-bold"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">User Data Deletion Contact</h2>
            <p>
              If you have any questions, privacy concerns, or data deletion requests regarding {BRAND_NAME}, please contact our developer support team:
            </p>
            <p className="mt-2 font-bold text-emerald-800">
              Email: support@spendtrack.ai
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};