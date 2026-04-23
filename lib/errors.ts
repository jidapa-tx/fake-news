import { NextResponse } from 'next/server';

export interface ErrorPayload {
  code: string;
  message_th: string;
  message_en: string;
}

const ERROR_MAP: Record<string, ErrorPayload> = {
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message_th: 'ข้อมูลที่ส่งมาไม่ถูกต้อง', message_en: 'Invalid input data' },
  TEXT_TOO_LONG: { code: 'TEXT_TOO_LONG', message_th: 'ข้อความยาวเกิน 5,000 ตัวอักษร', message_en: 'Text exceeds 5000 characters' },
  INVALID_URL: { code: 'INVALID_URL', message_th: 'รูปแบบ URL ไม่ถูกต้อง', message_en: 'Invalid URL format' },
  FILE_TOO_LARGE: { code: 'FILE_TOO_LARGE', message_th: 'ไฟล์มีขนาดเกิน 10 MB', message_en: 'File size exceeds 10 MB' },
  UNSUPPORTED_TYPE: { code: 'UNSUPPORTED_TYPE', message_th: 'ประเภทไฟล์ไม่รองรับ รองรับเฉพาะ JPG, PNG, WEBP', message_en: 'Unsupported file type. Only JPG, PNG, WEBP allowed' },
  RATE_LIMITED: { code: 'RATE_LIMITED', message_th: 'คุณส่งคำขอเร็วเกินไป กรุณารอสักครู่', message_en: 'Too many requests. Please wait a moment' },
  GEMINI_ERROR: { code: 'GEMINI_ERROR', message_th: 'ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้', message_en: 'AI service temporarily unavailable' },
  NOT_FOUND: { code: 'NOT_FOUND', message_th: 'ไม่พบข้อมูลที่ร้องขอ', message_en: 'Resource not found' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message_th: 'เกิดข้อผิดพลาดภายในระบบ', message_en: 'Internal server error' },
};

export function errorResponse(code: string, status = 400): NextResponse {
  const payload = ERROR_MAP[code] ?? ERROR_MAP.INTERNAL_ERROR;
  return NextResponse.json({ error: payload }, { status });
}
