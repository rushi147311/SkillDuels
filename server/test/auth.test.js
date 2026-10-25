const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Module = require("node:module");
const path = require("node:path");
const { beforeEach, test } = require("node:test");
const jwt = require("jsonwebtoken");
const realBcrypt = require("bcryptjs");

process.env.JWT_SECRET = "test-secret-with-enough-length-for-testing-only";

const rows = [];
const sent = [];
let emailFailure = false;

const matches = (user, query) => {
  if (query.$or && !query.$or.some((part) => matches(user, part))) return false;
  if (query.email && user.email !== query.email) return false;
  if (query.username && user.username !== query.username) return false;
  if (query.isEmailVerified !== undefined && user.isEmailVerified !== query.isEmailVerified) return false;
  return true;
};

class FakeUser {
  constructor(data) { Object.assign(this, data); }
  toObject() { return { ...this }; }
  async save() {
    const index = rows.findIndex((row) => row._id === this._id);
    if (index === -1) rows.push(this);
    else rows[index] = this;
    return this;
  }
  static async create(data) {
    const user = new FakeUser({
      ...data,
      _id: String(rows.length + 1),
      password: await realBcrypt.hash(data.password, 4),
      role: data.role || "user",
      isEmailVerified: data.isEmailVerified || false,
      tokenVersion: 0,
    });
    rows.push(user);
    return user;
  }
  static async findOne(query) { return rows.find((row) => matches(row, query)) || null; }
  static findOneAndUpdate(query, update) {
    const user = rows.find((row) =>
      row.emailVerificationTokenHash === query.emailVerificationTokenHash &&
      row.emailVerificationExpiresAt > query.emailVerificationExpiresAt.$gt &&
      row.isEmailVerified === query.isEmailVerified
    );
    if (user) {
      Object.assign(user, update.$set);
      delete user.emailVerificationTokenHash;
      delete user.emailVerificationExpiresAt;
    }
    return { select: async () => user || null };
  }
  static findById(id) { return { select: async () => rows.find((row) => row._id === String(id)) || null }; }
  static async updateOne(query, update) {
    const user = rows.find((row) => row._id === String(query._id));
    if (user && update.$inc?.tokenVersion) user.tokenVersion += update.$inc.tokenVersion;
  }
}

const controllerPath = path.resolve(__dirname, "../controllers/authController.js");
const middlewarePath = path.resolve(__dirname, "../middleware/authMiddleware.js");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "../models/User" && [controllerPath, middlewarePath].includes(parent?.filename)) return FakeUser;
  if (request === "bcryptjs" && parent?.filename === controllerPath) {
    return { compare: async (password, hash) => realBcrypt.compare(password, hash) };
  }
  if (request === "../services/emailServices" && parent?.filename === controllerPath) {
    return {
      sendVerificationEmail: async (message) => {
        if (emailFailure) throw new Error("mail failure");
        sent.push(message);
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const auth = require("../controllers/authController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
Module._load = originalLoad;

beforeEach(() => {
  rows.length = 0;
  sent.length = 0;
  emailFailure = false;
});

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const request = (body = {}, extra = {}) => ({ body, headers: {}, ...extra });
const register = (body = {}) => auth.register(request(body), response());
const validRegistration = (extra = {}) => ({
  username: "player-one",
  email: "player@example.test",
  password: "StrongPass123!",
  ...extra,
});

test("successful registration stores a password hash and leaves email unverified", async () => {
  const res = response();
  await auth.register(request(validRegistration({ role: "admin" })), res);
  assert.equal(res.statusCode, 201);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].isEmailVerified, false);
  assert.equal(rows[0].role, "user");
  assert.notEqual(rows[0].password, "StrongPass123!");
  assert.equal(await realBcrypt.compare("StrongPass123!", rows[0].password), true);
  assert.equal(sent.length, 1);
  assert.equal(rows[0].emailVerificationTokenHash, crypto.createHash("sha256").update(sent[0].token).digest("hex"));
  assert.equal(rows[0].emailVerificationTokenHash.includes(sent[0].token), false);
  assert.equal(res.body.token, undefined);
});

test("registration with an existing email does not create duplicates or disclose account status", async () => {
  await register(validRegistration());
  sent.length = 0;
  const res = await register(validRegistration({ username: "another-name" }));
  assert.equal(res.statusCode, 202);
  assert.equal(rows.length, 1);
  assert.equal(sent.length, 0);
});

test("registration rejects missing, malformed, and out-of-range input", async () => {
  for (const body of [
    { email: "person@example.test", password: "StrongPass123!" },
    validRegistration({ email: "not-an-email" }),
    validRegistration({ username: "ab" }),
    validRegistration({ password: "short" }),
  ]) {
    assert.equal((await register(body)).statusCode, 400);
  }
  assert.equal(rows.length, 0);
});

test("email verification succeeds once; a reused token is rejected", async () => {
  await register(validRegistration());
  const res = response();
  await auth.verifyEmail(request({ token: sent[0].token }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(rows[0].isEmailVerified, true);
  assert.equal(rows[0].emailVerificationTokenHash, undefined);
  const reused = response();
  await auth.verifyEmail(request({ token: sent[0].token }), reused);
  assert.equal(reused.statusCode, 400);
});

test("invalid and expired verification tokens are rejected", async () => {
  assert.equal((await auth.verifyEmail(request({ token: "bad" }), response())).statusCode, 400);
  rows.push(new FakeUser({
    _id: "expired",
    isEmailVerified: false,
    emailVerificationTokenHash: crypto.createHash("sha256").update("a".repeat(64)).digest("hex"),
    emailVerificationExpiresAt: new Date(Date.now() - 1000),
  }));
  assert.equal((await auth.verifyEmail(request({ token: "a".repeat(64) }), response())).statusCode, 400);
});

test("resending verification sends a fresh link and enforces a cooldown", async () => {
  await register(validRegistration());
  sent.length = 0;
  const first = response();
  await auth.resendVerification(request({ email: "player@example.test" }), first);
  assert.equal(first.statusCode, 200);
  assert.equal(sent.length, 1);
  const second = response();
  await auth.resendVerification(request({ email: "player@example.test" }), second);
  assert.equal(second.statusCode, 429);
});

test("resend does not disclose whether an address has an account", async () => {
  const res = response();
  await auth.resendVerification(request({ email: "unknown@example.test" }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 0);
});

test("email delivery failure leaves an unverified account that can retry", async () => {
  emailFailure = true;
  const failed = await register(validRegistration({ email: "failed@example.test" }));
  assert.equal(failed.statusCode, 503);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].isEmailVerified, false);
  emailFailure = false;
  const retried = response();
  await auth.resendVerification(request({ email: "failed@example.test" }), retried);
  assert.equal(retried.statusCode, 200);
  assert.equal(sent.length, 1);
});

test("correct credentials create a session only after verification", async () => {
  const user = await FakeUser.create(validRegistration({ isEmailVerified: true }));
  const res = response();
  await auth.login(request({ identifier: user.email, password: "StrongPass123!" }), res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.token);
});

test("incorrect credentials are rejected", async () => {
  await FakeUser.create(validRegistration({ isEmailVerified: true }));
  const res = response();
  await auth.login(request({ identifier: "player@example.test", password: "incorrect" }), res);
  assert.equal(res.statusCode, 401);
});

test("unverified users cannot log in or receive a token", async () => {
  await FakeUser.create(validRegistration());
  const res = response();
  await auth.login(request({ identifier: "player@example.test", password: "StrongPass123!" }), res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, "EMAIL_NOT_VERIFIED");
  assert.equal(res.body.token, undefined);
});

test("provisioned administrators can sign in; ordinary users cannot use admin login", async () => {
  const admin = await FakeUser.create(validRegistration({ role: "admin", isEmailVerified: true }));
  const allowed = response();
  await auth.adminLogin(request({ identifier: admin.email, password: "StrongPass123!" }), allowed);
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.body.data.role, "admin");

  const user = await FakeUser.create({
    username: "player-two", email: "second@example.test",
    password: "StrongPass123!", isEmailVerified: true,
  });
  const denied = response();
  await auth.adminLogin(request({ identifier: user.email, password: "StrongPass123!" }), denied);
  assert.equal(denied.statusCode, 401);
});

test("registration cannot self-assign an administrator role", async () => {
  await register(validRegistration({ role: "admin", isAdmin: true }));
  assert.equal(rows[0].role, "user");
});

test("admin APIs reject missing, invalid, expired, and normal-user tokens", async () => {
  const user = await FakeUser.create(validRegistration({ isEmailVerified: true }));
  const cases = [
    undefined,
    "Bearer invalid-token",
    "Bearer " + jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: -1 }),
  ];
  for (const authorization of cases) {
    const res = response();
    await protect(request({}, { headers: authorization ? { authorization } : {} }), res, () => {
      throw new Error("next should not run");
    });
    assert.equal(res.statusCode, 401);
  }

  const forgedRoleToken = jwt.sign(
    { id: user._id, role: "admin", tokenVersion: 0 },
    process.env.JWT_SECRET
  );
  const protectedRequest = request({}, { headers: { authorization: "Bearer " + forgedRoleToken } });
  let proceeded = false;
  await protect(protectedRequest, response(), () => { proceeded = true; });
  assert.equal(proceeded, true);
  assert.equal(protectedRequest.user.role, "user");
  const denied = response();
  requireAdmin(protectedRequest, denied, () => { throw new Error("admin check should reject"); });
  assert.equal(denied.statusCode, 403);
});

test("password hashing middleware is registered and bcrypt produces verifiable hashes", async () => {
  const User = require("../models/User");
  const hooks = User.schema.s.hooks._pres.get("save");
  assert.ok(hooks.some((entry) => entry.fn.toString().includes("bcrypt.hash")));
  const hash = await realBcrypt.hash("StrongPass123!", 10);
  assert.notEqual(hash, "StrongPass123!");
  assert.equal(await realBcrypt.compare("StrongPass123!", hash), true);
});
