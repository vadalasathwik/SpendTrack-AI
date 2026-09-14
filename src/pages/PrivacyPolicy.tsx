import React from 'react';
import { BRAND_NAME } from '../constants/brand.js';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80">
        <header className="border-b border-slate-200/80 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
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
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">About {BRAND_NAME}</h2>
            <p>
              {BRAND_NAME} is an AI-powered personal finance and household consumption companion designed to help users track expenses, budgets, recurring subscriptions, and receipt images directly within their user-owned Google Workspace account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">Information We Collect & Google Integrations</h2>
            <p className="mb-3">
              {BRAND_NAME} accesses and processes user data strictly to provide core financial management features through the following Google integrations:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-700 font-medium">
              <li>
                <strong>Google Sign-In Authentication:</strong> We use Google Sign-In (OAuth 2.0) to securely authenticate your identity (basic profile name and email address) without requesting or storing any separate passwords.
              </li>
              <li>
                <strong>Google Sheets Storage:</strong> All your financial records, expense logs, budget targets, and recurring payment schedules are stored inside a user-owned Google Sheets spreadsheet (titled <em>TrackPay Database</em>) residing directly in your personal Google Drive. {BRAND_NAME} operates on a data-sovereignty model—your raw financial data stays under your Google account control.
              </li>
              <li>
                <strong>Google Calendar Access:</strong> With your explicit consent, {BRAND_NAME} accesses your Google Calendar to create, update, and sync bill payment reminders and subscription due dates so you never miss a payment.
              </li>
              <li>
                <strong>Receipt Scanning with Gemini AI:</strong> When you upload a receipt photo or invoice image, {BRAND_NAME} processes the image using Google Gemini AI models to automatically extract merchant name, transaction date, line items, and payment totals to simplify expense entry.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">How We Use Your Data</h2>
            <p>
              Your data is used exclusively to deliver the functionality of {BRAND_NAME}: synchronizing financial records to your designated Google Sheet, storing receipt attachments in your personal Google Drive folder, scheduling payment reminders in Google Calendar, and serving real-time AI spending insights powered by Gemini AI.
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
              {BRAND_NAME}'s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
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

          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-3">User Data Control & Deletion</h2>
            <p className="mb-3">
              You retain total control and ownership of all your data at all times:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 font-medium">
              <li>
                <strong>Revoking Access:</strong> You can revoke {BRAND_NAME}'s access at any time via your{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline"
                >
                  Google Account Security Settings
                </a>.
              </li>
              <li>
                <strong>Deleting Data:</strong> Because your data resides in your Google Drive and Google Sheets, you can directly delete the <em>TrackPay Database</em> spreadsheet and receipt files from your Google Drive whenever you wish.
              </li>
              <li>
                <strong>Requesting Support / Complete Deletion:</strong> To request account disassociation or complete deletion assistance, please contact us at the details below.
              </li>
            </ul>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">User Data Deletion Contact</h2>
            <p>
              If you have any questions, privacy concerns, or data deletion requests regarding {BRAND_NAME}, please contact our developer support team:
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