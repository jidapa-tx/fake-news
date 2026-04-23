export function PrivacyBanner() {
  return (
    <div className="bg-sky-50 dark:bg-sky-950 border-b border-sky-200 dark:border-sky-900 px-4 py-2 text-center text-sm text-sky-700 dark:text-sky-300 font-medium flex items-center justify-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true" className="flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 010 12c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
      </svg>
      ข้อมูลเก็บในเครื่องคุณเท่านั้น ไม่ส่งไป server
    </div>
  );
}
