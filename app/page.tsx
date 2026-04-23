'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocalHistory } from '@/hooks/useLocalHistory';
import { VerdictBadge } from '@/components/VerdictBadge';
import { TextAnalyzeResponse } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

type Tab = 'text' | 'url' | 'image';

const TAB_ICONS = {
  text: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369.64.05 1.084.69.858 1.295l-.17.454a2.25 2.25 0 001.955 3.024h.087c1.207 0 2.332-.557 3.081-1.516a9.002 9.002 0 00-2.573-12.508 9.015 9.015 0 00-9.23 1.15A9.002 9.002 0 002.25 12.76z" />
    </svg>
  ),
  url: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  ),
  image: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
};

const TAB_LABELS: Record<Tab, string> = {
  text: 'ข้อความ',
  url: 'URL',
  image: 'รูปภาพ',
};

const INPUT_LABELS: Record<Tab, string> = {
  text: 'พิมพ์ข้อความ',
  url: 'วาง URL',
  image: 'อัปโหลดภาพ',
};

export default function HomePage() {
  const router = useRouter();
  const { items, addItem } = useLocalHistory();
  const [tab, setTab] = useState<Tab>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    setError('');
    setLoading(true);

    try {
      if (tab === 'text' || tab === 'url') {
        const query = tab === 'text' ? textInput : urlInput;
        if (!query.trim()) { setError('กรุณาใส่ข้อความหรือ URL'); setLoading(false); return; }
        if (tab === 'url') {
          try { new URL(query); } catch { setError('รูปแบบ URL ไม่ถูกต้อง'); setLoading(false); return; }
        }

        const res = await fetch('/api/analyze/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, queryType: tab }),
        });

        const data: TextAnalyzeResponse = await res.json();
        if (!res.ok) { setError((data as unknown as { error: { message_th: string } }).error.message_th); setLoading(false); return; }

        addItem({
          queryType: tab,
          queryPreview: query.slice(0, 100),
          query,
          verdict: data.verdict,
          score: data.score,
          confidence: data.confidence,
          analysisId: data.analysisId,
        });

        router.push(`/result/${data.analysisId}`);
      } else {
        if (!imageFile) { setError('กรุณาเลือกรูปภาพ'); setLoading(false); return; }
        const formData = new FormData();
        formData.append('image', imageFile);
        const res = await fetch('/api/analyze/image', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) { setError(data.error?.message_th ?? 'เกิดข้อผิดพลาด'); setLoading(false); return; }
        addItem({
          queryType: 'image',
          queryPreview: imageFile.name,
          query: imageFile.name,
          verdict: data.verdict,
          score: data.score,
          confidence: data.confidence,
          analysisId: data.analysisId,
        });
        router.push(`/result/${data.analysisId}`);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleFileSelect(file: File) {
    if (file.size > 10 * 1024 * 1024) { setError('ไฟล์มีขนาดเกิน 10 MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('ประเภทไฟล์ไม่รองรับ รองรับเฉพาะ JPG, PNG, WEBP'); return; }
    setError('');
    setImageFile(file);
  }

  const recentItems = items.slice(0, 3);

  return (
    <div id="main">
      {/* Hero */}
      <div
        className="py-14 px-6 text-center text-white bg-[#0F172A]"
        style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(29,78,216,0.18) 0%, transparent 70%)' }}
      >
        <h1 className="text-[2.25rem] sm:text-[3rem] font-semibold mb-3 leading-tight">ตรวจสอบข่าวก่อนส่งต่อ</h1>
        <p className="text-base opacity-85 max-w-md mx-auto leading-relaxed mb-5">
          เพราะข่าวปลอมแพร่เร็วกว่าที่คุณคิด — ตรวจสอบด้วย AI และแหล่งข้อมูลที่น่าเชื่อถือ
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['✓ AI วิเคราะห์', '✓ แหล่งข้อมูลไทย', '✓ ปลอดภัย 100%'].map((pill) => (
            <span key={pill} className="bg-white/10 border border-white/20 text-white/90 rounded-full px-3.5 py-1 text-sm font-medium">
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 mb-12">
        {/* Input Card */}
        <div className="bg-white/97 dark:bg-gray-900/97 backdrop-blur-xl border border-white/60 dark:border-white/[0.06] rounded-2xl shadow-2xl p-7">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-5">
            {(['text', 'url', 'image'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                  tab === t
                    ? 'bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                aria-pressed={tab === t}
              >
                {TAB_ICONS[t]}
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Input label */}
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{INPUT_LABELS[tab]}</p>

          {/* Text Input */}
          {tab === 'text' && (
            <div>
              <textarea
                className="w-full min-h-[120px] p-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:border-blue-700 outline-none resize-y focus:ring-2 focus:ring-blue-700/20"
                placeholder="วางข้อความหรือเนื้อหาข่าวที่ต้องการตรวจสอบ..."
                maxLength={5000}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                aria-label="ข้อความที่ต้องการตรวจสอบ"
              />
              <div className="text-right text-xs text-slate-400 mt-1 tabular-nums">{textInput.length}/5000</div>
            </div>
          )}

          {/* URL Input */}
          {tab === 'url' && (
            <div>
              <input
                type="url"
                className="w-full p-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:border-blue-700 outline-none min-h-[44px] focus:ring-2 focus:ring-blue-700/20"
                placeholder="https://example.com/news/article"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                aria-label="URL ที่ต้องการตรวจสอบ"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                ใส่ URL ของข่าวที่ต้องการตรวจสอบ ระบบจะวิเคราะห์ทั้งเนื้อหาและความน่าเชื่อถือของเว็บไซต์
              </p>
            </div>
          )}

          {/* Image Upload */}
          {tab === 'image' && (
            <div>
              <div
                className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                role="button"
                aria-label="อัปโหลดรูปภาพ"
              >
                <div className="text-4xl mb-3">{imageFile ? '✅' : '📷'}</div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {imageFile ? imageFile.name : 'คลิกหรือลากไฟล์รูปภาพมาวางที่นี่'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : 'รองรับ JPG, PNG, WEBP — ขนาดสูงสุด 10 MB'}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 mt-3" role="alert">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 h-[52px] bg-blue-800 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-base font-semibold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-blue-700 focus-visible:outline-offset-2"
            aria-label={loading ? 'กำลังวิเคราะห์' : 'ตรวจสอบ'}
          >
            {loading ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={20} height={20} aria-hidden="true" className="animate-spin motion-reduce:animate-none">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                กำลังวิเคราะห์...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={20} height={20} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                ตรวจสอบ
              </>
            )}
          </button>
        </div>

        {/* How-to section */}
        <div className="mt-8">
          <h2 className="text-base font-semibold mb-4 text-slate-700 dark:text-slate-300">วิธีใช้งาน</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                step: '1',
                label: 'ใส่ข้อมูล',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={28} height={28} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                ),
              },
              {
                step: '2',
                label: 'AI วิเคราะห์',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={28} height={28} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                ),
              },
              {
                step: '3',
                label: 'ดูผลลัพธ์',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={28} height={28} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map(({ step, label, icon }) => (
              <div key={step} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">ขั้นที่ {step}</span>
                <div className="text-blue-700 dark:text-blue-400">{icon}</div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Checks */}
        {recentItems.length > 0 && (
          <>
            <h2 className="text-base font-semibold mt-8 mb-3">ตรวจสอบล่าสุด</h2>
            <div className="flex flex-col gap-2">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/result/${item.analysisId}`}
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-700 transition-colors no-underline text-slate-900 dark:text-slate-100"
                >
                  <VerdictBadge verdict={item.verdict} />
                  <span className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.queryPreview}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: th })}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
