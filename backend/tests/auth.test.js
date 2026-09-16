const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

// Helper ẩn email
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

// Helper validate CCCD
function validateCccd(cccd) {
  if (!cccd) return false;
  const clean = String(cccd).trim().replace(/\D/g, '');
  return clean.length === 12;
}

// Helper sinh OTP
function generateOtp() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  return { code, expiresAt };
}

describe('1. Kiểm thử Bảo mật & Mã hóa mật khẩu (Bcrypt)', () => {
  it('Băm mật khẩu thành công với thuật toán Bcrypt (salt rounds = 10)', async () => {
    const rawPassword = 'Password123@!';
    const hash = await bcrypt.hash(rawPassword, 10);

    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Hash phải theo định dạng chuẩn Bcrypt');
    assert.equal(hash.length, 60, 'Chuỗi băm Bcrypt chuẩn phải có đúng 60 ký tự');
  });

  it('Hai lần băm cùng một mật khẩu phải tạo ra 2 chuỗi hash khác nhau (Có Salt ngẫu nhiên)', async () => {
    const rawPassword = 'SecretPassword2026';
    const hash1 = await bcrypt.hash(rawPassword, 10);
    const hash2 = await bcrypt.hash(rawPassword, 10);

    assert.notEqual(hash1, hash2, 'Bcrypt phải sinh salt ngẫu nhiên bảo vệ chống Rainbow Table');
  });

  it('So sánh mật khẩu: Khớp khi nhập đúng mật khẩu gốc', async () => {
    const rawPassword = 'ChinhXac123';
    const hash = await bcrypt.hash(rawPassword, 10);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.equal(isMatch, true, 'bcrypt.compare phải trả về true khi mật khẩu đúng');
  });

  it('So sánh mật khẩu: Từ chối khi nhập sai mật khẩu', async () => {
    const rawPassword = 'DungMatKhau';
    const wrongPassword = 'SaiMatKhau';
    const hash = await bcrypt.hash(rawPassword, 10);

    const isMatch = await bcrypt.compare(wrongPassword, hash);
    assert.equal(isMatch, false, 'bcrypt.compare phải trả về false khi mật khẩu sai');
  });
});

describe('2. Kiểm thử Xác thực Định dạng Số CCCD Học Viên', () => {
  it('Chấp nhận số CCCD hợp lệ gồm chính xác 12 chữ số', () => {
    assert.equal(validateCccd('001203004567'), true);
    assert.equal(validateCccd(' 038203009999 '), true, 'Phải tự động loại bỏ khoảng trắng thừa');
  });

  it('Từ chối số CCCD không đủ 12 số hoặc chứa ký tự bất thường', () => {
    assert.equal(validateCccd('012345678'), false, 'Từ chối CCCD chỉ có 9 số');
    assert.equal(validateCccd('00120300456789'), false, 'Từ chối CCCD quá 12 số');
    assert.equal(validateCccd(''), false, 'Từ chối CCCD rỗng');
    assert.equal(validateCccd(null), false, 'Từ chối giá trị null');
  });
});

describe('3. Kiểm thử Cơ chế Sinh Mã Xác Thực OTP & TTL (Time-To-Live)', () => {
  it('Sinh mã OTP gồm chính xác 6 chữ số số học', () => {
    for (let i = 0; i < 20; i++) {
      const { code } = generateOtp();
      assert.equal(code.length, 6, 'Mã OTP phải có đúng 6 ký tự');
      assert.match(code, /^\d{6}$/, 'Mã OTP chỉ chứa các chữ số từ 0 đến 9');
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999, 'Mã OTP phải nằm trong dải 100000 - 999999');
    }
  });

  it('Thời hạn hiệu lực của mã OTP phải là 10 phút', () => {
    const now = Date.now();
    const { expiresAt } = generateOtp();
    const diffMinutes = Math.round((expiresAt - now) / 60000);
    assert.equal(diffMinutes, 10, 'Thời gian sống TTL của OTP phải đúng 10 phút');
  });
});

describe('4. Kiểm thử Bảo Mật Ẩn Email (Email Masking)', () => {
  it('Ẩn địa chỉ email an toàn trước khi hiển thị cho người dùng', () => {
    assert.equal(maskEmail('danghoangnam@gmail.com'), 'da***m@gmail.com');
    assert.equal(maskEmail('admin@driveedu.vn'), 'ad***n@driveedu.vn');
    assert.equal(maskEmail('a@b.com'), 'a***@b.com');
  });
});
