import React from 'react';
import { BRAND_NAME } from '../constants/brand.js';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80">
        <header className="border-b border-slate-200/80 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
            <p className="text-sm font-semibold text-emerald-700 mt-1">Last updated: 4 September 2026</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3.5 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            &larr; Back to {BRAND_NAME}
          </a>
        </header>

        <div className="space-y-8 text-slate-600 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Service Description</h2>
            <p>
              {BRAND_NAME} provides personal finance tracking, budget analysis, recurring subscription management, AI receipt processing, and Gemini AI insights integrated directly with your Google Workspace account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">User Responsibilities</h2>
            <p>
              As a user of {BRAND_NAME}, you are responsible for maintaining the confidentiality of your Google account credentials, ensuring the accuracy of financial records you input, and securing access to devices used to run the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Google Workspace Usage</h2>
            <p>
              By authorizing {BRAND_NAME}, you grant the application permission to create, update, and manage designated {BRAND_NAME} spreadsheets in Google Sheets, receipt folders in Google Drive, and bill reminder events in Google Calendar strictly to support requested application features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Data Ownership</h2>
            <p>
              All financial data, spreadsheets, receipt uploads, and generated reports created using {BRAND_NAME} remain your exclusive property. {BRAND_NAME} claims no ownership over any content stored in your Google Workspace account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Termination</h2>
            <p>
              You may terminate your use of {BRAND_NAME} at any time by revoking the app's OAuth permissions via your Google Account Security Settings. Termination will immediately cease all bi-directional sync with your Google account.
            </p>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Contact Information</h2>
            <p>
              For any inquiries or assistance regarding these Terms of Service, please contact:
            </p>
            <p className="mt-2 font-bold text-slate-900">
              Email:{' '}
              <a href="mailto:thesonusathwik@gmail.com" className="text-emerald-700 hover:underline">
                thesonusathwik@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}