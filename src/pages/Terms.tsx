import React from 'react';
import { BRAND_NAME } from '../constants/brand.js';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80">
        <header className="border-b border-slate-200/80 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
            <p className="text-sm font-semibold text-emerald-700 mt-1">Last updated: 14 September 2026</p>
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
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">1. Service Description</h2>
            <p>
              {BRAND_NAME} provides personal finance tracking, budget analysis, recurring subscription management, AI-driven receipt scanning, and spending insights integrated with your user-owned Google Workspace account (Google Sheets, Google Drive, and Google Calendar).
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
              <li>Refraining from attempting to probe, scan, compromise, or reverse engineer any part of the application infrastructure or API integrations.</li>
              <li>Refraining from uploading malicious files, illegal materials, or deceptive financial records.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">3. User Ownership of Data</h2>
            <p>
              You retain full, exclusive ownership of all financial records, spreadsheets, uploaded receipt images, and generated reports created or processed using {BRAND_NAME}. {BRAND_NAME} claims no intellectual property rights or ownership over any content stored in your Google Workspace account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">4. Google Workspace Permissions</h2>
            <p>
              By granting access to {BRAND_NAME}, you authorize the application to read, write, update, and manage designated {BRAND_NAME} files in Google Drive, spreadsheets in Google Sheets, and payment reminder events in Google Calendar strictly as required to perform user-requested features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">5. Disclaimer of Warranties & Limitation of Liability</h2>
            <div className="space-y-3 bg-slate-100/80 p-5 rounded-2xl border border-slate-200 text-slate-700 font-medium">
              <p>
                <strong>AS-IS Provision:</strong> {BRAND_NAME} is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express, implied, or statutory.
              </p>
              <p>
                <strong>No Financial Advisory Status:</strong> {BRAND_NAME} is a personal record-keeping utility and AI calculation assistant. It does not provide certified financial, tax, legal, or accounting advice. Users are solely responsible for reviewing and verifying financial decisions.
              </p>
              <p>
                <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, {BRAND_NAME} and its developers disclaim all liability for any direct, indirect, incidental, consequential, or special damages, including loss of data, unexpected charges, or operational interruptions resulting from your use of the application.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">6. Termination & Revocation</h2>
            <p>
              You may terminate your use of {BRAND_NAME} at any time by revoking the application&apos;s OAuth authorization through your Google Account Security Settings. Termination immediately halts all communication with your Google account.
            </p>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">7. Contact Information</h2>
            <p>
              If you have any questions or concerns regarding these Terms of Service, please contact:
            </p>
            <p className="mt-3 font-bold text-slate-900">
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