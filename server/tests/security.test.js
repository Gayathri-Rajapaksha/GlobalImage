const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Modules to test
const { checkEnv } = require('../utils/validateEnv');
const {
  authenticateToken,
  requireAdmin,
  requireStaffOrAdmin,
  requireRole
} = require('../middleware/auth');

describe('1. Environment Configuration & Validation', () => {
  it('should report an error when MONGO_URI is missing', () => {
    const { errors } = checkEnv({
      JWT_SECRET: 'super-secure-random-token-secret-at-least-32-chars'
    });
    assert.ok(errors.some(e => e.includes('MONGO_URI is required')));
  });

  it('should report an error when MONGO_URI does not start with mongodb:// or mongodb+srv://', () => {
    const { errors } = checkEnv({
      MONGO_URI: 'mysql://localhost:3306/db',
      JWT_SECRET: 'super-secure-random-token-secret-at-least-32-chars'
    });
    assert.ok(errors.some(e => e.includes('must be a valid MongoDB connection string')));
  });

  it('should report an error when JWT_SECRET is missing', () => {
    const { errors } = checkEnv({
      MONGO_URI: 'mongodb://localhost:27017/global_image'
    });
    assert.ok(errors.some(e => e.includes('JWT_SECRET is required')));
  });

  it('should reject known insecure placeholder secrets', () => {
    const placeholders = ['your_jwt_secret_key_here', 'secret', 'fallback_secret', 'changeme', 'short'];
    for (const ph of placeholders) {
      const { errors } = checkEnv({
        MONGO_URI: 'mongodb://localhost:27017/global_image',
        JWT_SECRET: ph
      });
      assert.ok(
        errors.some(e => e.includes('weak or default placeholder value')),
        `Expected rejection for placeholder secret: ${ph}`
      );
    }
  });

  it('should pass with 0 errors when required variables are correctly formatted', () => {
    const { errors } = checkEnv({
      MONGO_URI: 'mongodb://localhost:27017/global_image',
      JWT_SECRET: 'a-sufficiently-long-and-cryptographically-secure-random-key'
    });
    assert.strictEqual(errors.length, 0);
  });
});

describe('2. Cryptographic Password Hashing (bcryptjs)', () => {
  it('should hash passwords with salt and verify matches', async () => {
    const plain = 'StrongPassw0rd!#';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plain, salt);

    assert.notStrictEqual(plain, hash);
    assert.ok(hash.startsWith('$2'));

    const isMatch = await bcrypt.compare(plain, hash);
    assert.strictEqual(isMatch, true);

    const isBadMatch = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isBadMatch, false);
  });
});

describe('3. JWT Token Security & Verification', () => {
  const secret = 'test-secret-key-that-is-at-least-32-characters-long';

  it('should generate verifiable JWTs for authorized users', () => {
    const payload = { userId: '12345', email: 'test@example.com', role: 'client' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);

    assert.strictEqual(decoded.userId, '12345');
    assert.strictEqual(decoded.email, 'test@example.com');
    assert.strictEqual(decoded.role, 'client');
  });

  it('should reject tokens signed with a different secret', () => {
    const token = jwt.sign({ userId: '12345' }, 'wrong-secret-key-123456789012345678');
    assert.throws(() => {
      jwt.verify(token, secret);
    }, /invalid signature/);
  });

  it('should reject expired tokens', () => {
    const token = jwt.sign({ userId: '12345' }, secret, { expiresIn: -1 });
    assert.throws(() => {
      jwt.verify(token, secret);
    }, /jwt expired/);
  });
});

describe('4. RBAC & Authentication Middleware', () => {
  const secret = 'test-auth-middleware-jwt-secret-key-for-unit-tests';
  process.env.JWT_SECRET = secret;

  function mockResponse() {
    const res = {};
    res.statusCode = 200;
    res.body = null;
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(data) {
      this.body = data;
      return this;
    };
    return res;
  }

  it('authenticateToken should reject missing Authorization header with 401', () => {
    const req = { header: () => undefined };
    const res = mockResponse();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('authenticateToken should reject invalid token with 401', () => {
    const req = { header: () => 'Bearer invalid.token.payload' };
    const res = mockResponse();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
  });

  it('authenticateToken should decode valid token and invoke next()', () => {
    const token = jwt.sign({ userId: 'u1', email: 'u1@test.com', role: 'admin', isAdmin: true }, secret);
    const req = { header: () => `Bearer ${token}` };
    const res = mockResponse();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.userId, 'u1');
    assert.strictEqual(req.user.isAdmin, true);
  });

  it('requireAdmin should reject client users with 403', () => {
    const req = { user: { userId: 'u2', role: 'client', isAdmin: false } };
    const res = mockResponse();
    let nextCalled = false;

    requireAdmin(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });

  it('requireAdmin should permit admin users with next()', () => {
    const req = { user: { userId: 'u1', role: 'admin', isAdmin: true } };
    const res = mockResponse();
    let nextCalled = false;

    requireAdmin(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
  });

  it('requireStaffOrAdmin should permit staff users with next()', () => {
    const req = { user: { userId: 's1', role: 'staff' } };
    const res = mockResponse();
    let nextCalled = false;

    requireStaffOrAdmin(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
  });

  it('requireStaffOrAdmin should reject client users with 403', () => {
    const req = { user: { userId: 'c1', role: 'client' } };
    const res = mockResponse();
    let nextCalled = false;

    requireStaffOrAdmin(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });
});

describe('5. Path Traversal Hardening', () => {
  it('should neutralize path traversal payloads via path.basename', () => {
    const payloads = [
      '../../../../etc/passwd',
      '..\\..\\..\\windows\\win.ini',
      '....//....//config.json',
      'foo/bar/secret.txt'
    ];

    const uploadsDir = path.resolve(__dirname, '../uploads');

    for (const raw of payloads) {
      const safe = path.basename(raw);
      const target = path.resolve(uploadsDir, safe);
      // Ensure target is strictly inside uploadsDir
      assert.ok(
        target.startsWith(uploadsDir),
        `Path traversal escape detected for: ${raw} -> resolved ${target}`
      );
      assert.ok(!safe.includes('/'), `Slash remained in base: ${safe}`);
      assert.ok(!safe.includes('\\'), `Backslash remained in base: ${safe}`);
    }
  });
});

describe('6. SSRF Protection on Gallery Downloads', () => {
  function validateDownloadUrl(inputUrl) {
    let parsed;
    try {
      parsed = new URL(inputUrl);
    } catch {
      return false;
    }
    const allowedProtocols = ['https:', 'http:'];
    const allowedHosts = ['res.cloudinary.com'];
    return (
      allowedProtocols.includes(parsed.protocol) &&
      allowedHosts.includes(parsed.hostname.toLowerCase())
    );
  }

  it('should reject internal network URLs and localhost SSRF attempts', () => {
    const dangerous = [
      'http://localhost:5050/api/admin',
      'http://127.0.0.1:8080/admin',
      'http://169.254.169.254/latest/meta-data/',
      'http://192.168.1.1/router-login',
      'file:///etc/passwd',
      'ftp://ftp.server.com/secret'
    ];

    for (const url of dangerous) {
      assert.strictEqual(validateDownloadUrl(url), false, `SSRF allowed for: ${url}`);
    }
  });

  it('should accept valid Cloudinary media URLs', () => {
    const safe = [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'http://res.cloudinary.com/globalimage/image/upload/v1234/test.png'
    ];

    for (const url of safe) {
      assert.strictEqual(validateDownloadUrl(url), true, `Safe URL rejected: ${url}`);
    }
  });
});
