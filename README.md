# xgaigu.com

Website kết nối – video – livestream – hẹn gặp (dành cho 18+). Node.js + Express + SQLite, giao diện SPA thuần JS (không cần build).

## Tính năng
- Cổng xác nhận 18+, đăng ký/đăng nhập (mật khẩu bcrypt, cookie phiên httpOnly)
- Feed video dọc kiểu TikTok (tải file MP4/WebM hoặc dán link YouTube/.mp4/.m3u8)
- Dưới mỗi video: Thích · Bình luận · Nhắn tin · **Gọi** · **Hẹn gặp** · Chia sẻ · Báo cáo
- Chat thời gian thực (Server-Sent Events), lời mời hẹn gặp có đồng ý/từ chối, trang "Lịch hẹn"
- Livestream: phát bằng camera trình duyệt (WebRTC), nhúng YouTube Live, hoặc luồng HLS; chat + thả tim + đếm người xem
- Hồ sơ, ảnh đại diện, bộ lọc "Làm quen", trang admin xử lý báo cáo, khoá user/ẩn video
- Bảo mật: helmet/CSP, rate limit, kiểm tra loại file, số điện thoại chỉ lộ khi chủ tài khoản bật

## Chạy thử trên máy
```bash
npm install
cp .env.example .env   # rồi sửa SESSION_SECRET, ADMIN_EMAIL
npm start              # http://localhost:3000
```
Cần **Node.js >= 22.13** (dùng `node:sqlite` có sẵn, không phải biên dịch gói native).
Đăng ký tài khoản bằng đúng email `ADMIN_EMAIL` để có quyền admin (`#/admin`).

## Đưa lên GitHub
```bash
git remote add origin https://github.com/<tên-bạn>/xgaigu.git
git branch -M main
git push -u origin main
```

## Deploy lên Hostinger (gói Business/Cloud có "Node.js Web App")
1. hPanel → **Websites → Add website → Node.js Apps → Import Git Repository**, đăng nhập GitHub và chọn repo `xgaigu`.
2. Cấu hình: Node version **22.x** (hoặc 24), build command `npm install`, start command `npm start`, entry file `server.js`.
3. **Environment variables**: `NODE_ENV=production`, `SESSION_SECRET=<chuỗi ngẫu nhiên dài>`, `ADMIN_EMAIL=<email của bạn>`.
   Để dữ liệu **không mất khi deploy lại**, đặt `DATA_DIR` và `UPLOAD_DIR` ra ngoài thư mục ứng dụng, ví dụ
   `DATA_DIR=/home/<user>/xgaigu-data/db` và `UPLOAD_DIR=/home/<user>/xgaigu-data/uploads` (tạo sẵn thư mục qua File Manager/SSH).
4. Deploy. Sau đó vào **Domains** gắn `xgaigu.com` (trỏ nameserver/A record về Hostinger theo hướng dẫn trong hPanel) và bật SSL miễn phí.
5. Mỗi lần `git push` lên `main`, bật **Auto deploy** để Hostinger tự cập nhật.

## Lưu ý vận hành
- **Livestream WebRTC** dùng kết nối trực tiếp (P2P) nên phù hợp vài chục người xem. Muốn phát cho đông người, hãy dùng chế độ HLS/YouTube Live (OBS → dịch vụ stream) hoặc bổ sung máy chủ TURN/SFU (LiveKit, Janus…).
- Nếu proxy của gói hosting cắt kết nối SSE, chat vẫn tự kết nối lại; kiểm tra bằng `/healthz`.
- Lưu video lớn nên chuyển sang object storage (S3/R2) khi lượng người dùng tăng.
- Đây là nền tảng cho người trưởng thành: hãy duy trì kiểm duyệt (báo cáo → admin) và tuân thủ pháp luật về nội dung/mạng xã hội tại Việt Nam (đăng ký, quản lý nội dung, bảo vệ dữ liệu cá nhân).

## Thư viện nhạc trong trình chỉnh sửa video
- 600 bài nhạc không lời (24 thể loại × 25 bài, gồm nhiều bản remix sôi động: Vinahouse, Bass Boost, Dance Pop, Future House, Drill, Hardstyle…) do website **tự sáng tác bằng mã** (`public/js/music.js`) và tạo âm thanh ngay trên trình duyệt, nên không dính bản quyền bên thứ ba. Mỗi bài là một đoạn lặp (~15–28 giây) được lặp lại dưới video.
- Muốn thêm nhạc thật (MP3) đã có giấy phép sử dụng: đặt file vào `public/music/` rồi khai báo trong `public/data/music.json`, ví dụ:
  `[{ "id": "bai-1", "title": "Tên bài", "style": "Pop", "meta": "Tác giả · 120 BPM", "url": "/music/bai-1.mp3" }]`
  Các bài này sẽ hiện đầu danh sách. Chỉ thêm nhạc bạn có quyền phân phối (royalty-free/CC0 hoặc đã mua giấy phép).

## Gọi video giữa thành viên
- Gọi 1-1 bằng WebRTC; máy chủ chỉ chuyển tín hiệu (qua kênh SSE sẵn có), hình/tiếng đi thẳng giữa hai trình duyệt.
- Nút "Gọi video" có ở trang hồ sơ, đầu khung chat và bảng "Xem thông tin" của video. Người nhận cần đang mở website (chưa có thông báo đẩy khi đóng trình duyệt).
- Mỗi thành viên có thể tắt nhận cuộc gọi trong `#/me`. Có giới hạn 3 lần gọi/phút cho mỗi cặp người.
- Mặc định chỉ dùng STUN công cộng của Google; khoảng 10–20% cuộc gọi (mạng di động/NAT chặt) cần máy chủ TURN. Khi có TURN, đặt biến môi trường `TURN_URL` (vd `turn:turn.example.com:3478`), `TURN_USER`, `TURN_PASS`.

## Ngôn ngữ (đa quốc gia)
- Giao diện viết bằng tiếng Việt. Có **2 chế độ dịch**, tự chọn theo ngôn ngữ của khách:
  1. **Từ điển viết sẵn (chất lượng cao)** – chỉ dịch chữ của website (danh sách ở `scripts/i18n/catalog.json`, ~560 câu), **không đụng đến nội dung thành viên tự nhập** (tên, mô tả video, tin nhắn, bình luận, giới thiệu…). Hiện có 12 ngôn ngữ: `en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `th`, `id`, `fr`, `de`, `es`, `ru`, `ar` (Ả Rập hiển thị phải sang trái). File nguồn `scripts/i18n/<mã>.txt`, dạng mỗi dòng `số thứ tự|bản dịch`; chạy `node scripts/i18n-build.js` để tạo `public/i18n/*.json`.
  2. **Dịch máy (dự phòng)** cho các ngôn ngữ còn lại – qua `POST /api/translate`, có lưu bộ nhớ đệm. Ở chế độ này **cả nội dung thành viên tự nhập cũng được dịch** để trang đồng bộ (chỉ logo và danh sách ngôn ngữ, đánh dấu `.notranslate`, được giữ nguyên).
- Thêm ngôn ngữ mới: tạo `scripts/i18n/<mã>.txt` (đủ các dòng như `en.txt`), chạy lệnh build, commit `public/i18n/`.
- Thêm chữ mới vào giao diện: chạy `node scripts/i18n-catalog.js` (chỉ **nối thêm** vào cuối danh sách, không đổi thứ tự), rồi bổ sung bản dịch cho các dòng mới.
- **Mặc định là tiếng Việt** cho mọi khách. Nút 🌐 để đổi sang ngôn ngữ khác (lựa chọn được nhớ); khách cũng có thể bấm "Tự động theo quốc gia của bạn" (header của CDN qua `/api/geo`, nếu không có thì múi giờ thiết bị).
- Chế độ dịch máy: nếu có `GOOGLE_TRANSLATE_KEY` (Google Cloud Translation) thì dùng API chính thức, nếu không dùng điểm cuối miễn phí (chất lượng không đều).

## Tải video có logo
- Nút **Tải xuống** (chỉ với video tải lên từ máy; video dùng liên kết YouTube/ngoài thì không có) lưu video về máy khách **kèm logo xgaigu và biệt danh** ở góc dưới bên trái. Trên website, video vẫn hiển thị sạch, không logo.
- Trình duyệt vẽ logo + biệt danh thành ảnh PNG nhỏ (hiển thị đúng mọi ngôn ngữ/emoji) và gửi lên `POST /api/videos/:id/download`; máy chủ dùng **ffmpeg** (gói `ffmpeg-static`, tự tải khi `npm install`) ghép vào video rồi trả về file MP4. Kết quả được lưu đệm trong `uploads/wm/`.
- Nếu máy chủ không chạy được ffmpeg, trình duyệt tự chuyển sang cách dự phòng: phát video lên canvas kèm logo rồi ghi lại (mất đúng bằng thời lượng video, định dạng MP4/WebM tùy trình duyệt).

## Ứng dụng cài thẳng về máy (PWA)
Nút "Cài đặt ứng dụng" (thanh trên, trang chủ, chân trang) cài xgaigu thành app trên màn hình điện thoại/máy tính mà không qua CH Play / App Store.
- Android/Chrome/Edge: bấm là hiện hộp thoại cài đặt của trình duyệt. iPhone: Safari → Chia sẻ → "Thêm vào Màn hình chính" (Apple không cho cài một chạm).
- App chính là website (`public/sw.js` luôn lấy bản mới từ mạng trước), nên mọi thay đổi trên web hiện ngay trong app.
- Biểu tượng tạo bằng `node scripts/make-icons.js`. Cần HTTPS (xgaigu.com đã có).

### Đổi tên miền
1. Trỏ tên miền mới vào cùng app trên Hostinger, đặt `SITE_URL=https://ten-mien-moi.com`.
2. Giữ tên miền cũ trỏ vào app và đặt `LEGACY_HOSTS=xgaigu.com` (nhiều tên miền thì cách nhau bằng dấu phẩy), rồi Redeploy.
3. Link cũ và app đã cài từ tên miền cũ sẽ tự chuyển sang tên miền mới. App là một "cửa sổ" gắn với tên miền nên không đổi tên miền ngay trong chính nó được: khách sẽ thấy nút "Tải ứng dụng" ở tên miền mới để cài lại bản mới.

## Email
Đặt biến môi trường `SMTP_USER` (info@xgaigu.com) và `SMTP_PASS` (mật khẩu hộp thư), tuỳ chọn `SMTP_HOST`/`SMTP_PORT` (mặc định smtp.hostinger.com:465). Trang quản trị → mục **Email**: bật/tắt bắt buộc xác nhận email khi đăng ký, gửi email thử, gửi email quảng bá (có liên kết hủy nhận). Có nút "Quên mật khẩu?" ở màn hình đăng nhập.

## SEO khu vực
Mỗi miền / tỉnh / quận có trang riêng: `/khu-vuc/mien-nam/ho-chi-minh/quan-1` (tiêu đề, mô tả, từ khóa, giới thiệu, dữ liệu có cấu trúc). Admin sửa nội dung ở trang quản trị → **SEO khu vực**. Có `/sitemap.xml` và `/robots.txt`; hãy gửi sitemap trong Google Search Console.
