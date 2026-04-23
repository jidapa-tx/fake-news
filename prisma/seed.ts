import { PrismaClient, SourceType, VerdictLevel } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashText(text: string): string {
  return createHash('sha256')
    .update(text.toLowerCase().replace(/\s+/g, ' ').trim())
    .digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // TrustedSources
  const sources = [
    { name: 'Thairath', nameTh: 'ไทยรัฐ', domain: 'thairath.co.th', type: SourceType.TRUSTED_MEDIA, credibility: 80, language: 'th' },
    { name: 'Matichon', nameTh: 'มติชน', domain: 'matichon.co.th', type: SourceType.TRUSTED_MEDIA, credibility: 82, language: 'th' },
    { name: 'Prachachat', nameTh: 'ประชาชาติ', domain: 'prachachat.net', type: SourceType.TRUSTED_MEDIA, credibility: 78, language: 'th' },
    { name: 'Thai PBS', nameTh: 'ไทยพีบีเอส', domain: 'thaipbs.or.th', type: SourceType.TRUSTED_MEDIA, credibility: 90, language: 'th' },
    { name: 'Khao Sod', nameTh: 'ข่าวสด', domain: 'khaosod.co.th', type: SourceType.TRUSTED_MEDIA, credibility: 76, language: 'th' },
    { name: 'Post Today', nameTh: 'โพสต์ทูเดย์', domain: 'posttoday.com', type: SourceType.TRUSTED_MEDIA, credibility: 75, language: 'th' },
    { name: 'Nation Thailand', nameTh: 'เนชั่นไทย', domain: 'nationthailand.com', type: SourceType.TRUSTED_MEDIA, credibility: 77, language: 'both' },
    { name: 'AFP Fact Check TH', nameTh: 'AFP ตรวจสอบข้อเท็จจริง', domain: 'factcheck.afp.com', type: SourceType.FACT_CHECKER, credibility: 95, language: 'both' },
    { name: 'Anti-Fake News Center', nameTh: 'ศูนย์ต่อต้านข่าวปลอม', domain: 'antifakenewscenter.com', type: SourceType.GOV, credibility: 88, language: 'th' },
    { name: 'Sure And Share', nameTh: 'ชัวร์ก่อนแชร์', domain: 'sure.co.th', type: SourceType.FACT_CHECKER, credibility: 85, language: 'th' },
    { name: 'Cofact Thailand', nameTh: 'โคแฟกต์', domain: 'cofact.org', type: SourceType.FACT_CHECKER, credibility: 83, language: 'th' },
    { name: 'Fact Check Thailand', nameTh: 'แฟกต์เช็คไทยแลนด์', domain: 'factcheckthai.com', type: SourceType.FACT_CHECKER, credibility: 80, language: 'th' },
    { name: 'BBC News Thai', nameTh: 'บีบีซีไทย', domain: 'bbc.com/thai', type: SourceType.TRUSTED_MEDIA, credibility: 95, language: 'both' },
    { name: 'BBC News', nameTh: 'BBC', domain: 'bbc.com', type: SourceType.TRUSTED_MEDIA, credibility: 97, language: 'en' },
    { name: 'Reuters', nameTh: 'รอยเตอร์ส', domain: 'reuters.com', type: SourceType.TRUSTED_MEDIA, credibility: 97, language: 'en' },
    { name: 'AP News', nameTh: 'เอพี', domain: 'apnews.com', type: SourceType.TRUSTED_MEDIA, credibility: 96, language: 'en' },
    { name: 'Snopes', nameTh: 'สโนปส์', domain: 'snopes.com', type: SourceType.FACT_CHECKER, credibility: 92, language: 'en' },
    { name: 'FactCheck.org', nameTh: 'แฟกต์เช็ค', domain: 'factcheck.org', type: SourceType.FACT_CHECKER, credibility: 94, language: 'en' },
    { name: 'PolitiFact', nameTh: 'โพลิติแฟกต์', domain: 'politifact.com', type: SourceType.FACT_CHECKER, credibility: 90, language: 'en' },
    { name: 'Full Fact', nameTh: 'ฟูลแฟกต์', domain: 'fullfact.org', type: SourceType.FACT_CHECKER, credibility: 89, language: 'en' },
    { name: 'WHO', nameTh: 'องค์การอนามัยโลก', domain: 'who.int', type: SourceType.GOV, credibility: 93, language: 'en' },
    { name: 'Ministry of Public Health TH', nameTh: 'กระทรวงสาธารณสุข', domain: 'moph.go.th', type: SourceType.GOV, credibility: 85, language: 'th' },
  ];

  for (const source of sources) {
    await prisma.trustedSource.upsert({
      where: { domain: source.domain },
      update: source,
      create: source,
    });
  }
  console.log(`Seeded ${sources.length} trusted sources`);

  // KnownFakeClaims
  const fakeClaims = [
    { claim: 'ดื่มน้ำร้อนฆ่าไวรัสโคโรนาได้', verdict: VerdictLevel.DANGEROUS, evidence: 'WHO ยืนยันว่าการดื่มน้ำร้อนไม่สามารถฆ่าไวรัสโคโรนาได้ ไวรัสแพร่ผ่านระบบทางเดินหายใจ ไม่ใช่ระบบทางเดินอาหาร', firstSeenAt: new Date('2020-03-01') },
    { claim: 'วัคซีนโควิดมีชิปติดตาม 5G', verdict: VerdictLevel.DANGEROUS, evidence: 'ไม่มีหลักฐานทางวิทยาศาสตร์ใดสนับสนุน เป็นทฤษฎีสมคบคิดที่แพร่หลายในโซเชียลมีเดีย', firstSeenAt: new Date('2021-01-15') },
    { claim: 'กินกระเทียมป้องกันโควิดได้', verdict: VerdictLevel.SUSPICIOUS, evidence: 'WHO ระบุไม่มีหลักฐานว่ากระเทียมป้องกันโควิดได้ แม้กระเทียมจะมีสารต้านเชื้อโรคบางชนิด', firstSeenAt: new Date('2020-02-15') },
    { claim: 'น้ำยาบ้วนปากฆ่าไวรัสโควิดในลำคอ', verdict: VerdictLevel.SUSPICIOUS, evidence: 'ยังไม่มีหลักฐานเพียงพอว่าน้ำยาบ้วนปากป้องกันการติดเชื้อ COVID-19 ได้', firstSeenAt: new Date('2020-03-20') },
    { claim: 'บิล เกตส์ปล่อยโควิดเพื่อขายวัคซีน', verdict: VerdictLevel.DANGEROUS, evidence: 'ไม่มีหลักฐานใด ๆ และผิดข้อเท็จจริงโดยสิ้นเชิง เป็นทฤษฎีสมคบคิด', firstSeenAt: new Date('2020-04-01') },
    { claim: 'ไทยค้นพบยารักษาโควิดจากฟ้าทะลายโจร', verdict: VerdictLevel.SUSPICIOUS, evidence: 'กรมการแพทย์ระบุยังอยู่ในขั้นทดลอง ยังไม่ผ่านการทดสอบทางคลินิกครบถ้วน', firstSeenAt: new Date('2021-07-01') },
    { claim: 'แอลกอฮอล์ฉีดเข้าเส้นฆ่าโควิดได้', verdict: VerdictLevel.DANGEROUS, evidence: 'อันตรายถึงชีวิต ไม่มีผลป้องกันไวรัส ห้ามทดลองโดยเด็ดขาด', firstSeenAt: new Date('2020-04-25') },
    { claim: 'ยุงเป็นพาหะนำโรคโควิด', verdict: VerdictLevel.DANGEROUS, evidence: 'WHO ยืนยันโควิดไม่แพร่ผ่านยุง โรคแพร่ทางละอองฝอยทางอากาศ', firstSeenAt: new Date('2020-03-15') },
    { claim: 'นม UHT ทำให้ภูมิคุ้มกันต่ำ', verdict: VerdictLevel.SUSPICIOUS, evidence: 'ไม่มีหลักฐานทางการแพทย์รองรับว่านม UHT ส่งผลเสียต่อภูมิคุ้มกัน', firstSeenAt: new Date('2021-09-10') },
    { claim: 'รัฐบาลซ่อนตัวเลขผู้ติดเชื้อจริง', verdict: VerdictLevel.UNCERTAIN, evidence: 'ยังไม่มีหลักฐานเพียงพอ มีทั้งผู้สนับสนุนและคัดค้านข้อกล่าวหานี้', firstSeenAt: new Date('2021-05-01') },
    { claim: 'วัคซีนโควิดทำให้เป็นหมัน', verdict: VerdictLevel.DANGEROUS, evidence: 'ไม่มีหลักฐานทางวิทยาศาสตร์ นักวิทยาศาสตร์และองค์กรสาธารณสุขทั่วโลกยืนยันว่าเป็นข้อมูลเท็จ', firstSeenAt: new Date('2021-03-01') },
  ];

  for (const claim of fakeClaims) {
    const claimHash = hashText(claim.claim);
    await prisma.knownFakeClaim.upsert({
      where: { claimHash },
      update: { ...claim, claimHash },
      create: { ...claim, claimHash },
    });
  }
  console.log(`Seeded ${fakeClaims.length} known fake claims`);

  // SuspiciousDomains
  const suspiciousDomains = [
    { domain: 'news-fake-th.com', reason: 'ไม่มีการลงทะเบียนสื่อ ข้อมูล WHOIS ซ่อน โดเมนอายุน้อย', riskLevel: 'high' },
    { domain: 'thairath-news.net', reason: 'ปลอมแปลงชื่อใกล้เคียงสื่อจริง (ไทยรัฐ)', riskLevel: 'high' },
    { domain: 'breaking-thailand.info', reason: 'ไม่มีบรรณาธิการ เผยแพร่ข่าวปลอมซ้ำ', riskLevel: 'high' },
    { domain: 'covid-cure-thai.com', reason: 'เว็บไซต์รักษาโรคปลอม อ้างยารักษา COVID ที่ไม่ผ่านการรับรอง', riskLevel: 'high' },
    { domain: 'thai-viral-news.xyz', reason: 'โดเมน .xyz ไม่น่าเชื่อถือ ไม่มี SSL ไม่มีผู้รับผิดชอบ', riskLevel: 'high' },
    { domain: 'linetoday-fake.com', reason: 'ปลอมแปลง LINE Today ชื่อโดเมนทำให้เข้าใจผิด', riskLevel: 'high' },
    { domain: 'thaigov-news.net', reason: 'แอบอ้างเป็นรัฐบาลไทย ไม่ใช่เว็บไซต์ราชการ', riskLevel: 'high' },
    { domain: 'healthnews-th.info', reason: 'ข่าวสุขภาพปลอม ไม่อ้างอิงแหล่งที่มา', riskLevel: 'medium' },
    { domain: 'viral-share-th.com', reason: 'เว็บรวมข่าวไม่ตรวจสอบข้อเท็จจริง', riskLevel: 'medium' },
    { domain: 'clickbait-news.asia', reason: 'เนื้อหาหลอกคลิก ไม่มีหลักฐาน', riskLevel: 'medium' },
    { domain: 'rumors-thailand.net', reason: 'เผยแพร่ข่าวลือโดยไม่ตรวจสอบ', riskLevel: 'medium' },
    { domain: 'fake-health-th.com', reason: 'แพร่ข่าวสุขภาพเท็จ อ้างสูตรยารักษาโรค', riskLevel: 'high' },
  ];

  for (const sd of suspiciousDomains) {
    await prisma.suspiciousDomain.upsert({
      where: { domain: sd.domain },
      update: sd,
      create: sd,
    });
  }
  console.log(`Seeded ${suspiciousDomains.length} suspicious domains`);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
