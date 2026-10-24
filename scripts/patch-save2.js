// Part 2 of the save feature: the private "Đã lưu" tab on the member's own profile.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}
edit('public/js/app.js', [
  ["  const w = h('div', { class: 'wrap tk' }, head,\n    h('div', { class: 'tk-tabs' }, h('span', { class: 'on', html: icon('video') + '<span>Video (' + stats.videos + ')</span>' })),\n    videos.length ? h('div', { class: 'tgrid' }, videos.map(cell)) : h('div', { class: 'card empty' }, h('p', {}, 'Chưa có video.')));",
   `  const videosNodes = [videos.length ? h('div', { class: 'tgrid' }, videos.map(cell)) : h('div', { class: 'card empty' }, h('p', {}, 'Chưa có video.'))];
  const panel = h('div', {}, ...videosNodes);
  let tabsEl = h('div', { class: 'tk-tabs' }, h('span', { class: 'on', html: icon('video') + '<span>Video (' + stats.videos + ')</span>' }));
  if (me) { // only the owner sees the "Đã lưu" tab: saved videos are private
    const bV = h('button', { type: 'button', class: 'on', html: icon('video') + '<span>Video (' + stats.videos + ')</span>' });
    const bS = h('button', { type: 'button', 'aria-label': 'Đã lưu', html: icon('bookmark') + '<span>Đã lưu</span>' });
    tabsEl = h('div', { class: 'tk-tabs' }, bV, bS);
    bV.addEventListener('click', () => { bV.classList.add('on'); bS.classList.remove('on'); panel.replaceChildren(...videosNodes); });
    bS.addEventListener('click', async () => {
      bS.classList.add('on'); bV.classList.remove('on'); panel.replaceChildren(h('div', { class: 'spin' }));
      const note = h('p', { class: 'muted', style: 'font-size:13px;text-align:center;margin:12px 0' }, 'Chỉ mình bạn thấy danh sách này.');
      const grid = h('div', { class: 'tgrid' }), more = h('button', { class: 'btn', type: 'button', hidden: true, style: 'margin:16px auto;display:flex' }, 'Xem thêm');
      let offset = 0;
      const load = async () => {
        try {
          const d = await api('/me/saved?offset=' + offset);
          d.videos.forEach((v) => grid.append(areaTile(v)));
          offset = d.next; more.hidden = !d.more;
          if (!grid.children.length) panel.replaceChildren(note, h('div', { class: 'card empty' }, h('div', { class: 'ico', html: icon('bookmark') }), h('h3', {}, 'Chưa lưu video nào'), h('p', {}, 'Khi xem video, bấm biểu tượng dấu trang để lưu lại và xem sau tại đây.')));
        } catch (e) { fail(e); }
      };
      more.addEventListener('click', load);
      panel.replaceChildren(note, grid, more);
      await load();
    });
  }
  const w = h('div', { class: 'wrap tk' }, head, tabsEl, panel);`],
]);
console.log('patched part 2');
