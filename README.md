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
- 300 bài nhạc không lời (12 thể loại × 25 bài) do website **tự sáng tác bằng mã** (`public/js/music.js`) và tạo âm thanh ngay trên trình duyệt, nên không dính bản quyền bên thứ ba. Mỗi bài là một đoạn lặp (~15–28 giây) được lặp lại dưới video.
- Muốn thêm nhạc thật (MP3) đã có giấy phép sử dụng: đặt file vào `public/music/` rồi khai báo trong `public/data/music.json`, ví dụ:
  `[{ "id": "bai-1", "title": "Tên bài", "style": "Pop", "meta": "Tác giả · 120 BPM", "url": "/music/bai-1.mp3" }]`
  Các bài này sẽ hiện đầu danh sách. Chỉ thêm nhạc bạn có quyền phân phối (royalty-free/CC0 hoặc đã mua giấy phép).
