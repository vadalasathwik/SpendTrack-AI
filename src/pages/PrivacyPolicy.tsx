import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80">
        <header className="border-b border-slate-200/80 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
            <p className="text-sm font-semibold text-emerald-700 mt-1">Last updated: 4 September 2026</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3.5 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            &larr; Back to SpendTrack
          </a>
        </header>

        <div className="space-y-8 text-slate-600 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">About SpendTrack</h2>
            <p>
              SpendTrack is an AI-powered personal finance workspace designed to help users track expenses, budgets, recurring subscriptions, catalog purchases, and receipt images directly within their user-owned Google Workspace (Google Sheets, Google Drive, and Google Calendar).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Information We Collect</h2>
            <p className="mb-3">
              SpendTrack accesses and processes only the data necessary to provide and operate personal financial management features:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 font-medium">
              <li><strong>Google account information:</strong> Name, email address, and profile photo (optional).</li>
              <li><strong>Financial records:</strong> Expenses, budgets, and recurring payment details created within the application.</li>
              <li><strong>Receipt images:</strong> Invoices and receipt images uploaded by the user.</li>
              <li><strong>Google Workspace metadata:</strong> Google Sheets metadata and Google Drive file identifiers required for workspace synchronization and storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">How We Use Your Data</h2>
            <p>
              Your data is used solely to provide core app functionality: synchronizing financial records to your designated Google Sheet, storing receipt images in your personal Google Drive, generating bill reminders on your Google Calendar, and providing real-time AI spending insights via Gemini AI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Data Storage</h2>
            <p>
              Your financial data and uploaded files reside inside your own personal Google Account (Google Drive and Google Sheets). SpendTrack operates on a data sovereignty architecture and does not host or store your financial records on external database servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Data Sharing</h2>
            <p className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-950 font-bold">
              SpendTrack does not sell or share personal information with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Google API Services</h2>
            <div className="p-5 bg-slate-100/80 border border-slate-200 rounded-2xl text-slate-800 font-semibold italic">
              SpendTrack's use of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Your Rights</h2>
            <p>
              You maintain full ownership of your data at all times. You can revoke SpendTrack’s OAuth access at any time through your Google Account Permissions. You may also delete your financial records and uploaded files directly from your Google Drive and Google Sheets workspace whenever you choose.
            </p>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Contact Us</h2>
            <p>
              If you have any questions or feedback regarding this Privacy Policy, please contact:
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