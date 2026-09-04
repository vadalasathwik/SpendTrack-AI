export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-8 prose">
      <h1>Privacy Policy</h1>
      <p>Last updated: 4 September 2026</p>

      <p>
        SpendTrack is a personal finance application that helps users manage
        expenses, recurring payments, budgets, receipts, and Google Sheets
        synchronization.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>Name and email address from Google Sign-In</li>
        <li>Profile photo (optional)</li>
        <li>Expense and budget records you create</li>
        <li>Receipt images you upload</li>
        <li>Google Sheets metadata required for synchronization</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>
        We use your information only to authenticate your account, synchronize
        your financial data with your Google Drive, generate AI insights, and
        improve your personal finance experience.
      </p>

      <h2>Data Storage</h2>
      <p>
        Your financial data is stored in your own Google account and associated
        cloud services. SpendTrack does not sell or share your personal data with
        third parties.
      </p>

      <h2>Google API Services</h2>
      <p>
        SpendTrack accesses Google Sheets and Google Drive only after your
        explicit consent. The application follows the Google API Services User
        Data Policy, including Limited Use requirements.
      </p>

      <h2>Data Deletion</h2>
      <p>
        You may delete your account data at any time by removing your Google
        Drive spreadsheet or contacting the developer.
      </p>

      <h2>Contact</h2>
      <p>
        Email: thesonusathwik@gmail.com
      </p>
    </div>
  );
}