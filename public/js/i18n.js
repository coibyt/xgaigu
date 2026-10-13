/* xgaigu – language selection.
 * The interface is written in Vietnamese; its own text is swapped for ready-made translations (static dictionaries in
 * /i18n/, built by scripts/i18n-build.js). Member-written content is never translated. The language is chosen automatically from the
 * visitor's COUNTRY (server header if present, otherwise the device time zone), can be changed by the visitor
 * (globe button), and the choice is remembered. Vietnamese visitors load nothing extra. */
(() => {
'use strict';

// [app code, native name, Google widget code]
const LANGS = [
  ['vi', 'Tiếng Việt'], ['en', 'English'], ['zh-CN', '简体中文'], ['zh-TW', '繁體中文'], ['ja', '日本語'], ['ko', '한국어'], ['th', 'ไทย'], ['id', 'Bahasa Indonesia'],
  ['ms', 'Bahasa Melayu'], ['tl', 'Filipino'], ['lo', 'ລາວ'], ['km', 'ខ្មែរ'], ['my', 'မြန်မာ'], ['hi', 'हिन्दी'], ['bn', 'বাংলা'], ['ur', 'اردو'], ['ne', 'नेपाली'],
  ['si', 'සිංහල'], ['ta', 'தமிழ்'], ['te', 'తెలుగు'], ['kn', 'ಕನ್ನಡ'], ['ml', 'മലയാളം'], ['mr', 'मराठी'], ['gu', 'ગુજરાતી'], ['pa', 'ਪੰਜਾਬੀ'], ['or', 'ଓଡ଼ିଆ'],
  ['es', 'Español'], ['pt', 'Português'], ['fr', 'Français'], ['de', 'Deutsch'], ['it', 'Italiano'], ['nl', 'Nederlands'], ['ru', 'Русский'], ['uk', 'Українська'],
  ['pl', 'Polski'], ['cs', 'Čeština'], ['sk', 'Slovenčina'], ['hu', 'Magyar'], ['ro', 'Română'], ['bg', 'Български'], ['el', 'Ελληνικά'], ['sr', 'Српски'],
  ['hr', 'Hrvatski'], ['bs', 'Bosanski'], ['sl', 'Slovenščina'], ['mk', 'Македонски'], ['sq', 'Shqip'], ['lt', 'Lietuvių'], ['lv', 'Latviešu'], ['et', 'Eesti'],
  ['fi', 'Suomi'], ['sv', 'Svenska'], ['da', 'Dansk'], ['no', 'Norsk'], ['is', 'Íslenska'], ['ga', 'Gaeilge'], ['cy', 'Cymraeg'], ['gd', 'Gàidhlig'],
  ['ca', 'Català'], ['eu', 'Euskara'], ['gl', 'Galego'], ['mt', 'Malti'], ['lb', 'Lëtzebuergesch'], ['fy', 'Frysk'], ['co', 'Corsu'], ['la', 'Latina'], ['eo', 'Esperanto'],
  ['be', 'Беларуская'], ['tr', 'Türkçe'], ['ar', 'العربية'], ['he', 'עברית', 'iw'], ['fa', 'فارسی'], ['ps', 'پښتو'], ['ku', 'Kurdî'], ['sd', 'سنڌي'], ['ug', 'ئۇيغۇرچە'], ['yi', 'ייִדיש'],
  ['ka', 'ქართული'], ['hy', 'Հայերեն'], ['az', 'Azərbaycan'], ['kk', 'Қазақша'], ['uz', 'Oʻzbek'], ['ky', 'Кыргызча'], ['tg', 'Тоҷикӣ'], ['tk', 'Türkmen'], ['mn', 'Монгол'], ['tt', 'Татар'],
  ['sw', 'Kiswahili'], ['am', 'አማርኛ'], ['so', 'Soomaali'], ['ha', 'Hausa'], ['yo', 'Yorùbá'], ['ig', 'Igbo'], ['zu', 'isiZulu'], ['xh', 'isiXhosa'], ['af', 'Afrikaans'],
  ['st', 'Sesotho'], ['sn', 'Shona'], ['ny', 'Chichewa'], ['rw', 'Kinyarwanda'], ['mg', 'Malagasy'],
  ['jv', 'Basa Jawa', 'jw'], ['su', 'Basa Sunda'], ['ceb', 'Cebuano'], ['haw', 'ʻŌlelo Hawaiʻi'], ['mi', 'Māori'], ['sm', 'Gagana Samoa'], ['hmn', 'Hmong'], ['ht', 'Kreyòl ayisyen'],
].map(([code, name, g]) => ({ code, name, g: g || code }));
const byCode = new Map(LANGS.map((l) => [l.code, l]));
const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi']);

// Main language(s) of each country (ISO 3166-1 alpha-2). Anything not listed falls back to English.
const COUNTRY_LANG = {};
const addCountries = (lang, list) => list.split(' ').forEach((c) => { COUNTRY_LANG[c] = lang; });
addCountries('vi', 'VN'); addCountries('th', 'TH'); addCountries('lo', 'LA'); addCountries('km', 'KH'); addCountries('my', 'MM'); addCountries('id', 'ID'); addCountries('ms', 'MY BN');
addCountries('tl', 'PH'); addCountries('zh-CN', 'CN'); addCountries('zh-TW', 'TW HK MO'); addCountries('ja', 'JP'); addCountries('ko', 'KR KP'); addCountries('mn', 'MN');
addCountries('hi', 'IN'); addCountries('bn', 'BD'); addCountries('ur', 'PK'); addCountries('ne', 'NP'); addCountries('si', 'LK'); addCountries('fa', 'IR AF');
addCountries('ar', 'SA AE EG IQ JO KW LB LY MA DZ TN OM QA BH SY YE SD PS MR'); addCountries('he', 'IL'); addCountries('tr', 'TR');
addCountries('en', 'US GB AU NZ IE CA ZA NG GH SG JM TT BS BB BZ GY LR SL ZM ZW BW NA MU FJ PG LS SZ GM SS VU SB KI TV NR FM MH PW TO AG DM GD KN LC VC IM JE GG GI BM KY VG AI MS TC FK SH GU VI AS MV BT');
addCountries('es', 'ES MX AR CO PE VE CL EC GT CU BO DO HN PY SV NI CR PA UY PR GQ'); addCountries('pt', 'PT BR AO MZ GW CV ST TL');
addCountries('fr', 'FR LU MC SN CI ML BF NE TD GN BJ TG CM CD CG GA CF BI DJ KM GF GP MQ RE YT NC PF PM WF BL MF'); addCountries('de', 'DE AT CH LI'); addCountries('it', 'IT SM VA');
addCountries('nl', 'NL BE SR AW CW SX'); addCountries('ru', 'RU BY KG'); addCountries('kk', 'KZ'); addCountries('uz', 'UZ'); addCountries('tk', 'TM'); addCountries('tg', 'TJ');
addCountries('uk', 'UA'); addCountries('ro', 'RO MD'); addCountries('hy', 'AM'); addCountries('az', 'AZ'); addCountries('ka', 'GE'); addCountries('pl', 'PL'); addCountries('cs', 'CZ');
addCountries('sk', 'SK'); addCountries('hu', 'HU'); addCountries('bg', 'BG'); addCountries('el', 'GR CY'); addCountries('sr', 'RS ME'); addCountries('hr', 'HR'); addCountries('bs', 'BA');
addCountries('sl', 'SI'); addCountries('mk', 'MK'); addCountries('sq', 'AL XK'); addCountries('lt', 'LT'); addCountries('lv', 'LV'); addCountries('et', 'EE'); addCountries('fi', 'FI');
addCountries('sv', 'SE AX'); addCountries('da', 'DK GL FO'); addCountries('no', 'NO SJ'); addCountries('is', 'IS'); addCountries('mt', 'MT'); addCountries('ca', 'AD');
addCountries('sw', 'KE TZ UG'); addCountries('am', 'ET ER'); addCountries('so', 'SO'); addCountries('rw', 'RW'); addCountries('mg', 'MG'); addCountries('ny', 'MW'); addCountries('ht', 'HT');
addCountries('sm', 'WS'); addCountries('mi', 'CK NU');

// Device time zone → country (used when the server cannot tell the visitor's country).
const TZ = {};
`VN:Asia/Ho_Chi_Minh,Asia/Saigon;TH:Asia/Bangkok;LA:Asia/Vientiane;KH:Asia/Phnom_Penh;MM:Asia/Yangon,Asia/Rangoon;MY:Asia/Kuala_Lumpur,Asia/Kuching;SG:Asia/Singapore;ID:Asia/Jakarta,Asia/Makassar,Asia/Jayapura,Asia/Pontianak;PH:Asia/Manila;BN:Asia/Brunei;TL:Asia/Dili;CN:Asia/Shanghai,Asia/Chongqing,Asia/Harbin,Asia/Urumqi;HK:Asia/Hong_Kong;MO:Asia/Macau;TW:Asia/Taipei;JP:Asia/Tokyo;KR:Asia/Seoul;KP:Asia/Pyongyang;MN:Asia/Ulaanbaatar,Asia/Hovd,Asia/Choibalsan;IN:Asia/Kolkata,Asia/Calcutta;BD:Asia/Dhaka;PK:Asia/Karachi;LK:Asia/Colombo;NP:Asia/Kathmandu,Asia/Katmandu;BT:Asia/Thimphu;MV:Indian/Maldives;AF:Asia/Kabul;IR:Asia/Tehran;IQ:Asia/Baghdad;SA:Asia/Riyadh;AE:Asia/Dubai;OM:Asia/Muscat;QA:Asia/Qatar;KW:Asia/Kuwait;BH:Asia/Bahrain;YE:Asia/Aden;JO:Asia/Amman;LB:Asia/Beirut;SY:Asia/Damascus;IL:Asia/Jerusalem,Asia/Tel_Aviv;PS:Asia/Gaza,Asia/Hebron;TR:Europe/Istanbul,Asia/Istanbul;GE:Asia/Tbilisi;AM:Asia/Yerevan;AZ:Asia/Baku;KZ:Asia/Almaty,Asia/Aqtau,Asia/Aqtobe,Asia/Qostanay,Asia/Oral,Asia/Qyzylorda;UZ:Asia/Tashkent,Asia/Samarkand;TM:Asia/Ashgabat;KG:Asia/Bishkek;TJ:Asia/Dushanbe;RU:Europe/Moscow,Asia/Yekaterinburg,Asia/Novosibirsk,Asia/Vladivostok,Asia/Krasnoyarsk,Asia/Irkutsk,Asia/Yakutsk,Asia/Magadan,Asia/Kamchatka,Europe/Kaliningrad,Europe/Samara,Asia/Omsk,Europe/Volgograd;BY:Europe/Minsk;UA:Europe/Kyiv,Europe/Kiev;MD:Europe/Chisinau;RO:Europe/Bucharest;BG:Europe/Sofia;GR:Europe/Athens;CY:Asia/Nicosia,Europe/Nicosia;HU:Europe/Budapest;SK:Europe/Bratislava;CZ:Europe/Prague;PL:Europe/Warsaw;DE:Europe/Berlin,Europe/Busingen;AT:Europe/Vienna;CH:Europe/Zurich;LI:Europe/Vaduz;IT:Europe/Rome;VA:Europe/Vatican;SM:Europe/San_Marino;MT:Europe/Malta;SI:Europe/Ljubljana;HR:Europe/Zagreb;BA:Europe/Sarajevo;RS:Europe/Belgrade;ME:Europe/Podgorica;MK:Europe/Skopje;AL:Europe/Tirane;FR:Europe/Paris;MC:Europe/Monaco;ES:Europe/Madrid,Atlantic/Canary,Africa/Ceuta;AD:Europe/Andorra;PT:Europe/Lisbon,Atlantic/Azores,Atlantic/Madeira;GB:Europe/London;IE:Europe/Dublin;IS:Atlantic/Reykjavik;NO:Europe/Oslo;SE:Europe/Stockholm;FI:Europe/Helsinki;DK:Europe/Copenhagen;EE:Europe/Tallinn;LV:Europe/Riga;LT:Europe/Vilnius;NL:Europe/Amsterdam;BE:Europe/Brussels;LU:Europe/Luxembourg;EG:Africa/Cairo;LY:Africa/Tripoli;TN:Africa/Tunis;DZ:Africa/Algiers;MA:Africa/Casablanca;SD:Africa/Khartoum;SS:Africa/Juba;ET:Africa/Addis_Ababa;KE:Africa/Nairobi;TZ:Africa/Dar_es_Salaam;UG:Africa/Kampala;RW:Africa/Kigali;BI:Africa/Bujumbura;SO:Africa/Mogadishu;DJ:Africa/Djibouti;ER:Africa/Asmara;NG:Africa/Lagos;GH:Africa/Accra;CI:Africa/Abidjan;SN:Africa/Dakar;ML:Africa/Bamako;BF:Africa/Ouagadougou;NE:Africa/Niamey;GN:Africa/Conakry;SL:Africa/Freetown;LR:Africa/Monrovia;TG:Africa/Lome;BJ:Africa/Porto-Novo;CM:Africa/Douala;GA:Africa/Libreville;CG:Africa/Brazzaville;CD:Africa/Kinshasa,Africa/Lubumbashi;AO:Africa/Luanda;ZM:Africa/Lusaka;ZW:Africa/Harare;MW:Africa/Blantyre;MZ:Africa/Maputo;BW:Africa/Gaborone;NA:Africa/Windhoek;ZA:Africa/Johannesburg;MG:Indian/Antananarivo;MU:Indian/Mauritius;TD:Africa/Ndjamena;CF:Africa/Bangui;CV:Atlantic/Cape_Verde;US:America/New_York,America/Chicago,America/Denver,America/Los_Angeles,America/Phoenix,America/Anchorage,Pacific/Honolulu,America/Detroit,America/Indiana/Indianapolis,America/Boise;CA:America/Toronto,America/Vancouver,America/Edmonton,America/Winnipeg,America/Halifax,America/St_Johns,America/Regina;MX:America/Mexico_City,America/Cancun,America/Tijuana,America/Monterrey;GT:America/Guatemala;BZ:America/Belize;SV:America/El_Salvador;HN:America/Tegucigalpa;NI:America/Managua;CR:America/Costa_Rica;PA:America/Panama;CU:America/Havana;DO:America/Santo_Domingo;HT:America/Port-au-Prince;JM:America/Jamaica;PR:America/Puerto_Rico;TT:America/Port_of_Spain;BS:America/Nassau;BB:America/Barbados;CO:America/Bogota;VE:America/Caracas;EC:America/Guayaquil;PE:America/Lima;BO:America/La_Paz;CL:America/Santiago;AR:America/Argentina/Buenos_Aires,America/Buenos_Aires;UY:America/Montevideo;PY:America/Asuncion;BR:America/Sao_Paulo,America/Manaus,America/Fortaleza,America/Bahia,America/Recife,America/Belem,America/Cuiaba,America/Campo_Grande;GY:America/Guyana;SR:America/Paramaribo;AU:Australia/Sydney,Australia/Melbourne,Australia/Brisbane,Australia/Perth,Australia/Adelaide,Australia/Darwin,Australia/Hobart;NZ:Pacific/Auckland;FJ:Pacific/Fiji;PG:Pacific/Port_Moresby;WS:Pacific/Apia;TO:Pacific/Tongatapu;GU:Pacific/Guam;GL:America/Godthab,America/Nuuk`
  .split(';').forEach((row) => { const [cc, zones] = row.split(':'); zones.split(',').forEach((z) => { TZ[z] = cc; }); });

function countryFromTimeZone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ[tz]) return TZ[tz];
  } catch {}
  const m = String(navigator.language || '').match(/-([A-Za-z]{2})$/); // e.g. "th-TH" → TH (weak signal, last resort)
  return m ? m[1].toUpperCase() : '';
}

const KEY = 'xg_lang';
const getSaved = () => { try { const v = localStorage.getItem(KEY); return v && byCode.has(v) ? v : ''; } catch { return ''; } };
function setCookie(v) {
  const host = location.hostname, parts = host.split('.');
  const dom = parts.length > 1 && !/^\d+(\.\d+){3}$/.test(host) ? '.' + parts.slice(-2).join('.') : '';
  const exp = v ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `googtrans=${v}; path=/${exp}`;
  if (dom) document.cookie = `googtrans=${v}; path=/; domain=${dom}${exp}`;
}

// ---------- translation engine ----------
// Two modes, chosen per language:
//  1) DICTIONARY (best): the website's own Vietnamese interface strings are listed in /i18n/catalog.json and have hand-made
//     translations in /i18n/<lang>.json. ONLY those strings are swapped – names, captions, messages and everything members
//     type is never touched. Available languages are listed in /i18n/index.json.
//  2) MACHINE (fallback for languages without a dictionary yet): visible text is translated through /api/translate and
//     cached. Elements marked translate="no" / .notranslate (member-written content) are skipped in both modes.
const E = { started: false, mode: '', exact: new Map(), frag: new Map(), tpl: [], fragRe: null, bound: new WeakMap() };
const T = { lang: 'vi', cache: new Map(), waiting: new Map(), timer: null, blockedUntil: 0, saveTimer: null };
const LS = 'xg_tr_';
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME']);
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lead = (k) => (k.match(/^\s*/) || [''])[0];
const trail = (k) => (k.match(/\s*$/) || [''])[0];
const worth = (t) => t.length >= 3 && /\p{L}{3,}/u.test(t);
const unveil = () => document.documentElement.classList.remove('xg-tr-pending');

function skipped(node, attrOnly) {
  for (let el = node.nodeType === 1 ? node : node.parentElement; el; el = el.parentElement) {
    if ((!attrOnly && SKIP.has(el.tagName)) || el.classList.contains('notranslate') || el.getAttribute('translate') === 'no') return true;
  }
  return false;
}

// ----- mode 1: dictionary -----
function build(catalog, tr) {
  const frags = [];
  catalog.forEach((key, i) => {
    const t = tr[i];
    if (!t || typeof t !== 'string') return;
    const core = key.trim();
    if (/\{\d\}/.test(key)) { // templates such as "Có {0} video và {1} thành viên quanh bạn"
      E.tpl.push([new RegExp('^' + esc(core).replace(/\\\{(\d)\\\}/g, '(.+?)') + '$'), t.trim()]);
      return;
    }
    E.exact.set(core, t.trim());
    // Substring replacement only for fragments (edge space/punctuation) or long sentences; short whole-label strings are exact-match only,
    // so e.g. "Thành phố" inside a place name like "Thành phố Hà Nội" is left alone.
    const fragment = /^\s|\s$/.test(key) || /^[^\p{L}\p{N}]/u.test(key) || /[^\p{L}\p{N}]$/u.test(key) || core.length >= 14;
    if (core.length >= 6 && fragment) { E.frag.set(key, lead(key) + t.trim() + trail(key)); frags.push(key); }
  });
  frags.sort((a, b) => b.length - a.length);
  const part = (k) => (/^[\p{L}\p{N}]/u.test(k) ? '(?<![\\p{L}\\p{N}])' : '') + esc(k) + (/[\p{L}\p{N}]$/u.test(k) ? '(?![\\p{L}\\p{N}])' : '');
  E.fragRe = frags.length ? new RegExp(frags.map(part).join('|'), 'gu') : null;
}
function translate(raw) {
  const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
  if (!core || !/\p{L}/u.test(core)) return null;
  const hit = E.exact.get(core);
  if (hit) return m[1] + hit + m[3];
  for (const [re, t] of E.tpl) { const x = core.match(re); if (x) return m[1] + t.replace(/\{(\d)\}/g, (_, i) => x[+i + 1]) + m[3]; }
  if (E.fragRe) { E.fragRe.lastIndex = 0; const out = raw.replace(E.fragRe, (k) => E.frag.get(k)); if (out !== raw) return out; }
  return null;
}
async function loadDict(code) {
  const get = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u); return r.json(); };
  build(await get('/i18n/catalog.json'), await get('/i18n/' + code + '.json'));
}

// ----- mode 2: machine translation fallback -----
function loadCache(lang) { try { const o = JSON.parse(localStorage.getItem(LS + lang) || '{}'); for (const k in o) T.cache.set(k, o[k]); } catch {} }
function saveCache() {
  clearTimeout(T.saveTimer);
  T.saveTimer = setTimeout(() => { try { localStorage.setItem(LS + T.lang, JSON.stringify(Object.fromEntries([...T.cache].slice(-1500)))); } catch {} }, 800);
}
function want(core, setter) {
  const hit = T.cache.get(core);
  if (hit) { setter(hit); return; }
  if (Date.now() < T.blockedUntil) return;
  (T.waiting.get(core) || T.waiting.set(core, []).get(core)).push(setter);
  clearTimeout(T.timer); T.timer = setTimeout(flush, 60);
}
async function flush() {
  if (!T.waiting.size) return;
  const batch = []; let chars = 0;
  for (const k of T.waiting.keys()) { if (batch.length >= 50 || chars + k.length > 4000) break; batch.push(k); chars += k.length; }
  const jobs = batch.map((k) => [k, T.waiting.get(k)]); batch.forEach((k) => T.waiting.delete(k));
  try {
    const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: T.lang, texts: batch }) });
    if (!r.ok) throw new Error(String(r.status));
    const { out } = await r.json();
    jobs.forEach(([k, setters], i) => { const tr = out[i]; if (tr) { T.cache.set(k, tr); setters.forEach((fn) => fn(tr)); } });
    saveCache();
  } catch { T.blockedUntil = Date.now() + 30000; }
  if (T.waiting.size) T.timer = setTimeout(flush, 30);
  unveil();
}

// ----- shared -----
function doText(node) {
  const raw = node.nodeValue;
  if (E.bound.get(node) === raw || skipped(node)) return;
  if (E.mode === 'dict') {
    const out = translate(raw);
    if (out !== null && out !== raw) { node.nodeValue = out; E.bound.set(node, out); }
    return;
  }
  const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
  if (!worth(core)) return;
  want(core, (tr) => { if (node.nodeValue === raw) { node.nodeValue = m[1] + tr + m[3]; E.bound.set(node, node.nodeValue); } });
}
function doAttr(el, name) {
  const v = el.getAttribute(name);
  if (!v) return;
  const done = E.bound.get(el) || {};
  if (done[name] === v || skipped(el, true)) return; // attributes (e.g. a textarea's placeholder) are fine even where the text itself is not translated
  const set = (tr) => { if (el.getAttribute(name) === v) { el.setAttribute(name, tr); done[name] = tr; E.bound.set(el, done); } };
  if (E.mode === 'dict') { const out = translate(v); if (out !== null && out !== v) set(out); return; }
  if (worth(v.trim())) want(v.trim(), set);
}
function scan(root) {
  if (root.nodeType === 3) return doText(root);
  if (root.nodeType !== 1 || skipped(root)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) doText(n);
  [root, ...root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')].forEach((el) => ATTRS.forEach((a) => el.hasAttribute && el.hasAttribute(a) && doAttr(el, a)));
}

async function startEngine(l) {
  if (E.started) return;
  E.started = true;
  document.documentElement.classList.add('xg-tr-pending'); setTimeout(unveil, 1500); // avoid a flash of Vietnamese
  let hasDict = false;
  try { hasDict = ((await (await fetch('/i18n/index.json')).json()).langs || []).includes(l.code); } catch {}
  if (hasDict) { try { await loadDict(l.code); E.mode = 'dict'; } catch {} }
  if (!E.mode) { E.mode = 'api'; T.lang = l.code; loadCache(l.code); }
  const go = () => {
    scan(document.body);
    const ti = document.querySelector('title');
    if (ti && ti.firstChild) {
      if (E.mode === 'dict') { const o = translate(ti.textContent); if (o) ti.textContent = o; }
      else if (worth(ti.textContent.trim())) want(ti.textContent.trim(), (tr) => { ti.textContent = tr; });
    }
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'childList') m.addedNodes.forEach(scan);
        else if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttr(m.target, m.attributeName);
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (E.mode === 'dict' || !T.waiting.size) unveil();
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
}

function apply(code) {
  const l = byCode.get(code) || byCode.get('vi');
  document.documentElement.lang = l.code;
  document.documentElement.dir = RTL.has(l.code) ? 'rtl' : 'ltr';
  state.code = l.code;
  setCookie(''); // remove the cookie left by an earlier Google-widget version
  if (l.code !== 'vi') startEngine(l);
}

const state = { code: 'vi', auto: true, country: '' };

async function serverCountry() {
  try { const r = await fetch('/api/geo', { cache: 'no-store' }); const d = await r.json(); return d.country || ''; } catch { return ''; }
}

// Decide the language: the visitor's saved choice, otherwise the main language of the country they are in.
const ready = (async () => {
  const saved = getSaved();
  if (saved) { state.auto = false; apply(saved); return state.code; }
  state.country = (await serverCountry()) || countryFromTimeZone();
  apply(COUNTRY_LANG[state.country] || (state.country ? 'en' : 'vi'));
  return state.code;
})();

window.XGI18n = {
  ready, LANGS, state,
  current: () => state.code,
  locale: () => (state.code === 'vi' ? 'vi-VN' : state.code),
  isAuto: () => state.auto,
  country: () => state.country,
  choose(code) { try { localStorage.setItem(KEY, code); } catch {} location.reload(); },
  useAuto() { try { localStorage.removeItem(KEY); } catch {} setCookie(''); location.reload(); },
};
})();
