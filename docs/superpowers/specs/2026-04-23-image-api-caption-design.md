# Image API: เพิ่ม Optional Caption Field

## Summary
เพิ่ม optional `caption` field ใน `/api/analyze/image` เพื่อให้ user ส่งข้อความประกอบภาพมาด้วยได้ Gemini จะวิเคราะห์ทั้งภาพและ caption พร้อมกัน

## Changes

### `app/api/analyze/image/route.ts`
- อ่าน `caption` จาก formData (optional)
- Validate: string, max 1000 chars
- ส่งต่อไปยัง `analyzeImage(buffer, mimeType, filename, caption)`

### `services/image-analyzer.ts`
- เพิ่ม `caption?: string` ใน signature ของ `analyzeImage`
- ส่งต่อไปยัง `analyzeImageForAI(base64, mimeType, caption)`

### `lib/gemini.ts`
- เพิ่ม `caption?: string` ใน signature ของ `analyzeImageForAI`
- ถ้ามี caption ให้ inject เป็น text part ก่อน inlineData:
  `{ text: \`Caption/context provided: "${caption}"\` }`

## Constraints
- Image ยังคง required
- Caption เป็น optional ทั้งหมด — ถ้าไม่ส่งมา behavior เดิมไม่เปลี่ยน
- ไม่เก็บ caption ลง DB (ไม่เป็น PII)
