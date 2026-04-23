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
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 py-14 px-6 text-center text-white">
        <h1 className="text-3xl font-semibold mb-3">ตรวจสอบข่าวก่อนส่งต่อ</h1>
        <p className="text-base opacity-85 max-w-md mx-auto leading-relaxed">
          เพราะข่าวปลอมแพร่เร็วกว่าที่คุณคิด — ตรวจสอบด้วย AI และแหล่งข้อมูลที่น่าเชื่อถือ
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 mb-12">
        {/* Input Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-7">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-5">
            {(['text', 'url', 'image'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t === 'text' ? '📝 ข้อความ' : t === 'url' ? '🔗 URL' : '🖼 รูปภาพ'}
              </button>
            ))}
          </div>

          {/* Text Input */}
          {tab === 'text' && (
            <div>
              <textarea
                className="w-full min-h-36 p-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:border-blue-800 outline-none resize-y"
                placeholder="วางข้อความหรือเนื้อหาข่าวที่ต้องการตรวจสอบ..."
                maxLength={5000}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <div className="text-right text-xs text-slate-400 mt-1">{textInput.length}/5000</div>
            </div>
          )}

          {/* URL Input */}
          {tab === 'url' && (
            <div>
              <input
                type="url"
                className="w-full p-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:border-blue-800 outline-none"
                placeholder="https://example.com/news/article"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
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
                className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
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

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 py-3.5 bg-blue-800 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl text-base font-semibold cursor-pointer transition-colors"
          >
            {loading ? 'กำลังตรวจสอบ...' : '🔍 ตรวจสอบ'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            { num: '12,847', label: 'ข่าวที่ตรวจสอบแล้ว' },
            { num: '73%', label: 'พบข้อมูลน่าสงสัย' },
            { num: '22+', label: 'แหล่งข้อมูลที่เชื่อถือได้' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-semibold text-blue-800 dark:text-blue-400">{s.num}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
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
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-800 transition-colors no-underline text-slate-900 dark:text-slate-100"
                >
                  <VerdictBadge verdict={item.verdict} />
                  <span className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.queryPreview}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
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
