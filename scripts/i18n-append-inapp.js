// One-off: translations for catalog indices 616-619 (in-app browser hint for the install button).
const fs = require('fs'), path = require('path');
const T = {
  en: ['You are in the Facebook/Zalo in-app browser, which cannot install apps. Open this page in Chrome (Android) or Safari (iPhone):', 'Tap the ⋮ menu or the “…” icon at the top.', 'Choose “Open in browser”.', 'Tap the “Get the app” button again in that browser.'],
  'zh-CN': ['您正在使用 Facebook/Zalo 内置浏览器，无法安装应用。请用 Chrome（安卓）或 Safari（iPhone）打开本页：', '点击顶部的 ⋮ 菜单或“…”图标。', '选择“在浏览器中打开”。', '在该浏览器中再次点击“下载应用”按钮。'],
  'zh-TW': ['您正在使用 Facebook/Zalo 內建瀏覽器，無法安裝應用程式。請用 Chrome（Android）或 Safari（iPhone）開啟本頁：', '點選頂部的 ⋮ 選單或「…」圖示。', '選擇「在瀏覽器中開啟」。', '在該瀏覽器中再次點選「下載應用程式」按鈕。'],
  ja: ['Facebook/Zalo のアプリ内ブラウザではインストールできません。Chrome（Android）または Safari（iPhone）でこのページを開いてください：', '上部の ⋮ メニューまたは「…」アイコンをタップします。', '「ブラウザで開く」を選びます。', 'そのブラウザで「アプリをダウンロード」ボタンをもう一度タップします。'],
  ko: ['Facebook/Zalo 인앱 브라우저에서는 설치할 수 없습니다. Chrome(Android) 또는 Safari(iPhone)에서 이 페이지를 여세요:', '상단의 ⋮ 메뉴 또는 “…” 아이콘을 누르세요.', '“브라우저에서 열기”를 선택하세요.', '해당 브라우저에서 “앱 다운로드” 버튼을 다시 누르세요.'],
  th: ['คุณกำลังใช้เบราว์เซอร์ในแอป Facebook/Zalo ซึ่งติดตั้งแอปไม่ได้ โปรดเปิดหน้านี้ด้วย Chrome (Android) หรือ Safari (iPhone):', 'แตะเมนู ⋮ หรือไอคอน “…” ด้านบน', 'เลือก “เปิดในเบราว์เซอร์”', 'แตะปุ่ม “ดาวน์โหลดแอป” อีกครั้งในเบราว์เซอร์นั้น'],
  id: ['Anda memakai browser dalam aplikasi Facebook/Zalo yang tidak bisa memasang aplikasi. Buka halaman ini di Chrome (Android) atau Safari (iPhone):', 'Ketuk menu ⋮ atau ikon “…” di bagian atas.', 'Pilih “Buka di browser”.', 'Ketuk lagi tombol “Unduh aplikasi” di browser tersebut.'],
  fr: ["Vous êtes dans le navigateur intégré de Facebook/Zalo, qui ne permet pas d'installer d'applications. Ouvrez cette page dans Chrome (Android) ou Safari (iPhone) :", 'Touchez le menu ⋮ ou l’icône « … » en haut.', 'Choisissez « Ouvrir dans le navigateur ».', 'Touchez de nouveau le bouton « Télécharger l\'appli » dans ce navigateur.'],
  de: ['Du nutzt den In-App-Browser von Facebook/Zalo, in dem sich keine Apps installieren lassen. Öffne diese Seite in Chrome (Android) oder Safari (iPhone):', 'Tippe oben auf das ⋮-Menü oder das „…“-Symbol.', 'Wähle „Im Browser öffnen“.', 'Tippe in diesem Browser erneut auf „App herunterladen“.'],
  es: ['Estás en el navegador integrado de Facebook/Zalo, que no permite instalar aplicaciones. Abre esta página en Chrome (Android) o Safari (iPhone):', 'Toca el menú ⋮ o el icono “…” de arriba.', 'Elige “Abrir en el navegador”.', 'Vuelve a tocar el botón “Descargar la app” en ese navegador.'],
  ru: ['Вы открыли страницу во встроенном браузере Facebook/Zalo, в нём нельзя установить приложение. Откройте её в Chrome (Android) или Safari (iPhone):', 'Нажмите меню ⋮ или значок «…» вверху.', 'Выберите «Открыть в браузере».', 'Снова нажмите кнопку «Скачать приложение» в этом браузере.'],
  ar: ['أنت تستخدم المتصفح المدمج في Facebook/Zalo ولا يمكنه تثبيت التطبيقات. افتح هذه الصفحة في Chrome (أندرويد) أو Safari (آيفون):', 'اضغط على قائمة ⋮ أو أيقونة «…» في الأعلى.', 'اختر «فتح في المتصفح».', 'اضغط على زر «حمّل التطبيق» مرة أخرى في ذلك المتصفح.'],
};
for (const [l, lines] of Object.entries(T)) {
  if (lines.length !== 4) throw new Error(l);
  const f = path.join(__dirname, 'i18n', l + '.txt');
  if (fs.readFileSync(f, 'utf8').includes('\n616|')) continue;
  fs.appendFileSync(f, lines.map((t, i) => (616 + i) + '|' + t).join('\n') + '\n');
}
