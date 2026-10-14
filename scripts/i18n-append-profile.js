// One-off: translations for catalog indices 638-642 (profile page).
const fs = require('fs'), path = require('path');
const T = {
  en: ['Profile link copied', 'Voice call', 'Share profile', 'Likes', 'More'],
  'zh-CN': ['已复制主页链接', '语音通话', '分享主页', '获赞', '更多'],
  'zh-TW': ['已複製個人檔案連結', '語音通話', '分享個人檔案', '獲讚', '更多'],
  ja: ['プロフィールのリンクをコピーしました', '音声通話', 'プロフィールを共有', 'いいね', 'その他'],
  ko: ['프로필 링크를 복사했습니다', '음성 통화', '프로필 공유', '좋아요', '더보기'],
  th: ['คัดลอกลิงก์โปรไฟล์แล้ว', 'โทรด้วยเสียง', 'แชร์โปรไฟล์', 'ถูกใจ', 'เพิ่มเติม'],
  id: ['Tautan profil disalin', 'Panggilan suara', 'Bagikan profil', 'Suka', 'Lainnya'],
  fr: ['Lien du profil copié', 'Appel vocal', 'Partager le profil', "J'aime", 'Plus'],
  de: ['Profillink kopiert', 'Sprachanruf', 'Profil teilen', 'Likes', 'Mehr'],
  es: ['Enlace del perfil copiado', 'Llamada de voz', 'Compartir perfil', 'Me gusta', 'Más'],
  ru: ['Ссылка на профиль скопирована', 'Голосовой вызов', 'Поделиться профилем', 'Лайки', 'Ещё'],
  ar: ['تم نسخ رابط الملف الشخصي', 'مكالمة صوتية', 'مشاركة الملف الشخصي', 'الإعجابات', 'المزيد'],
};
for (const [l, lines] of Object.entries(T)) {
  const f = path.join(__dirname, 'i18n', l + '.txt');
  if (fs.readFileSync(f, 'utf8').includes('\n638|')) continue;
  fs.appendFileSync(f, lines.map((t, i) => (638 + i) + '|' + t).join('\n') + '\n');
}
