// Every email xgaigu sends. Each function returns { subject, html, text }.
const m = require('./mail');
const { esc, p, small, link, button, callout, features, layout, textOf } = m;

const first = (name) => String(name || '').trim().split(/\s+/).slice(-1)[0] || 'bạn';

function verify({ name, url }) {
  const body = p(`Chào <b>${esc(name)}</b>,`) +
    p('Cảm ơn bạn đã chọn xgaigu. Chỉ cần một cú chạm để xác nhận địa chỉ email này là tài khoản của bạn sẵn sàng.') +
    button(url, 'Xác nhận email của tôi') +
    small('Liên kết có hiệu lực trong <b>48 giờ</b> và chỉ dùng được một lần. Nếu nút không bấm được, hãy dán địa chỉ sau vào trình duyệt:<br>' + link(url)) +
    '<div style="height:6px"></div>' + p('<b>Khi vào xgaigu, bạn có thể:</b>', 'margin-bottom:4px') +
    features([['🎬', 'Xem và đăng video', 'Giới thiệu bản thân bằng video, xem video của mọi người theo khu vực.'], ['💬', 'Nhắn tin & hẹn gặp', 'Làm quen qua tin nhắn, gọi video và đặt lịch hẹn có kiểm soát.'], ['📍', 'Tìm quanh bạn', 'Khám phá thành viên gần khu vực của bạn.']]) +
    callout('🔒', 'Không phải bạn đăng ký?', 'Hãy bỏ qua email này, tài khoản sẽ không được kích hoạt và không ai có thể đăng nhập bằng địa chỉ của bạn.');
  return { subject: `${first(name)} ơi, xác nhận email để bắt đầu với xgaigu`,
    html: layout({ preheader: 'Một bước nữa thôi để kích hoạt tài khoản xgaigu của bạn.', eyebrow: 'Chào mừng bạn', title: `Chỉ còn một bước nữa, ${first(name)}`, body }),
    text: textOf([`Chào ${name},`, 'Cảm ơn bạn đã chọn xgaigu. Hãy xác nhận email để kích hoạt tài khoản (liên kết có hiệu lực 48 giờ):', url, 'Nếu bạn không đăng ký, hãy bỏ qua email này.']) };
}

function welcome({ name, url }) {
  const body = p(`Chào <b>${esc(name)}</b>,`) +
    p('Tài khoản của bạn đã sẵn sàng. Rất vui được đón bạn vào cộng đồng xgaigu, đây là vài gợi ý để bạn bắt đầu thật suôn sẻ:') +
    features([['🖼️', 'Hoàn thiện hồ sơ', 'Thêm ảnh đại diện và vài dòng giới thiệu để mọi người hiểu bạn hơn.'], ['🎥', 'Đăng video đầu tiên', 'Chỉnh sửa, thêm nhạc, chọn ảnh bìa và chọn khu vực để đúng người nhìn thấy bạn.'], ['🧭', 'Khám phá theo khu vực', 'Duyệt video theo miền, tỉnh, quận hoặc bấm "Quanh đây".']]) +
    button(url, 'Khám phá xgaigu ngay') +
    callout('🛡️', 'Gặp gỡ an toàn', 'Hãy hẹn ở nơi công cộng, báo cho người thân biết, không chuyển tiền trước cho người lạ. Thấy nội dung đáng ngờ? Bấm biểu tượng cờ để báo cáo, chúng tôi xử lý ngay.');
  return { subject: `Chào mừng ${first(name)} đến với xgaigu 💖`,
    html: layout({ preheader: 'Tài khoản đã sẵn sàng. Đây là vài gợi ý để bạn bắt đầu.', eyebrow: 'Chào mừng', title: `Rất vui được gặp bạn, ${first(name)}`, body }),
    text: textOf([`Chào ${name},`, 'Tài khoản xgaigu của bạn đã sẵn sàng.', '1) Hoàn thiện hồ sơ  2) Đăng video đầu tiên  3) Khám phá theo khu vực', 'Bắt đầu: ' + url, 'Gặp gỡ an toàn: hẹn ở nơi công cộng, không chuyển tiền trước cho người lạ.']) };
}

function reset({ name, url }) {
  const body = p(`Chào <b>${esc(name)}</b>,`) +
    p('Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản xgaigu của bạn. Bấm nút bên dưới để chọn mật khẩu mới.') +
    button(url, 'Đặt lại mật khẩu') +
    small('Liên kết có hiệu lực trong <b>1 giờ</b> và chỉ dùng được một lần. Nếu nút không bấm được, hãy dán địa chỉ sau vào trình duyệt:<br>' + link(url)) +
    callout('🔒', 'Không phải bạn yêu cầu?', 'Bạn có thể yên tâm bỏ qua email này, mật khẩu hiện tại vẫn nguyên vẹn. Nếu thấy lặp lại nhiều lần, hãy viết cho chúng tôi để được kiểm tra.') +
    callout('💡', 'Mẹo chọn mật khẩu tốt', 'Dùng ít nhất 8 ký tự, kết hợp chữ và số, và không dùng chung với tài khoản khác.');
  return { subject: 'Đặt lại mật khẩu xgaigu của bạn',
    html: layout({ preheader: 'Bấm để chọn mật khẩu mới, liên kết có hiệu lực 1 giờ.', eyebrow: 'Bảo mật tài khoản', title: 'Đặt lại mật khẩu', body }),
    text: textOf([`Chào ${name},`, 'Bấm liên kết sau để đặt lại mật khẩu (có hiệu lực 1 giờ):', url, 'Nếu bạn không yêu cầu, hãy bỏ qua email này.']) };
}

function passwordChanged({ name, when, resetUrl }) {
  const body = p(`Chào <b>${esc(name)}</b>,`) +
    p(`Mật khẩu tài khoản xgaigu của bạn vừa được thay đổi vào lúc <b>${esc(when)}</b>. Vì an toàn, chúng tôi đã đăng xuất tài khoản của bạn trên mọi thiết bị.`) +
    callout('⚠️', 'Không phải bạn thực hiện?', `Hãy ${link(resetUrl, 'đặt lại mật khẩu ngay')} và viết cho chúng tôi qua info@xgaigu.com để được hỗ trợ khóa tài khoản kịp thời.`);
  return { subject: 'Mật khẩu xgaigu của bạn vừa được thay đổi',
    html: layout({ preheader: 'Chúng tôi xác nhận mật khẩu đã được đổi thành công.', eyebrow: 'Bảo mật tài khoản', title: 'Mật khẩu đã được thay đổi', body }),
    text: textOf([`Chào ${name},`, `Mật khẩu xgaigu của bạn vừa được thay đổi lúc ${when}. Bạn đã được đăng xuất khỏi mọi thiết bị.`, 'Không phải bạn? Hãy đặt lại mật khẩu ngay và viết cho info@xgaigu.com.']) };
}

// Marketing: the admin's own text in the same elegant frame. cta is optional.
function campaign({ name, subject, text, cta, unsubscribeUrl }) {
  const personal = String(text).replace(/\{name\}/g, name);
  const paras = personal.split(/\n{2,}/).map((x) => p(esc(x.trim()).replace(/\n/g, '<br>'))).join('');
  const body = paras + (cta ? button(cta.url, cta.label) : '');
  return { subject,
    html: layout({ preheader: personal.replace(/\s+/g, ' ').slice(0, 110), eyebrow: 'Tin từ xgaigu', title: subject, body,
      footerNote: `Bạn nhận email này vì đã đăng ký tài khoản tại xgaigu.com. <a href="${esc(unsubscribeUrl)}" style="color:#7b6e89;text-decoration:underline">Hủy nhận email quảng bá</a> (email về tài khoản và bảo mật vẫn được gửi).` }),
    text: textOf([personal, cta && `${cta.label}: ${cta.url}`, `Hủy nhận email quảng bá: ${unsubscribeUrl}`]) };
}

function test() {
  const body = p('Nếu bạn đọc được email này, hệ thống gửi email của <b>xgaigu.com</b> đang hoạt động bình thường. ✅') +
    callout('📬', 'Gợi ý', 'Hãy kiểm tra email này nằm ở Hộp thư đến hay Spam. Nếu vào Spam, hãy bấm "Không phải spam" để các email sau đến đúng chỗ.');
  return { subject: 'Email gửi thử từ xgaigu',
    html: layout({ preheader: 'Cấu hình gửi email của xgaigu đang hoạt động tốt.', eyebrow: 'Kiểm tra hệ thống', title: 'Email gửi thử thành công', body }),
    text: textOf(['Hệ thống gửi email của xgaigu.com đang hoạt động bình thường.']) };
}

module.exports = { verify, welcome, reset, passwordChanged, campaign, test };
