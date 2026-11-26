import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminAuthService } from './serverAuth.ts';

test('first-run setup claims admin credential once and issues valid Bearer token', () => {
  const auth = createAdminAuthService(() => ({}));
  assert.deepEqual(auth.getStatus(), { configured: false, source: 'unconfigured' });

  const badLogin = auth.login('adminuser', 'SomeLongPass123');
  assert.equal(badLogin.ok, false);
  if (!badLogin.ok) assert.equal(badLogin.status, 409);

  const setup = auth.setupFirstAdmin('adminuser', 'StrongPass99!');
  assert.equal(setup.ok, true);
  if (setup.ok) {
    assert.equal(setup.username, 'adminuser');
    const verified = auth.verifyBearerToken(`Bearer ${setup.token}`);
    assert.deepEqual(verified, { valid: true, username: 'adminuser' });
  }

  // Subsequent setup attempts are locked
  const secondSetup = auth.setupFirstAdmin('attacker', 'AnotherPass99!');
  assert.equal(secondSetup.ok, false);
  if (!secondSetup.ok) assert.equal(secondSetup.status, 409);

  // Login works with claimed credential and rejects wrong credentials
  const wrongPass = auth.login('adminuser', 'WrongPass99!');
  assert.equal(wrongPass.ok, false);
  if (!wrongPass.ok) assert.equal(wrongPass.status, 401);

  const goodLogin = auth.login('adminuser', 'StrongPass99!');
  assert.equal(goodLogin.ok, true);
  if (goodLogin.ok) {
    assert.deepEqual(auth.verifyBearerToken(`Bearer ${goodLogin.token}`), {
      valid: true,
      username: 'adminuser',
    });
    auth.revokeBearerToken(`Bearer ${goodLogin.token}`);
    assert.deepEqual(auth.verifyBearerToken(`Bearer ${goodLogin.token}`), {
      valid: false,
    });
  }
});

test('environment credentials take precedence and lock first-run setup', () => {
  const auth = createAdminAuthService(() => ({
    ADMIN_USERNAME: 'configured_user',
    ADMIN_PASSWORD: 'configured_password_123',
  }));
  assert.deepEqual(auth.getStatus(), { configured: true, source: 'env' });

  const blockedSetup = auth.setupFirstAdmin('other', 'OtherPass123!');
  assert.equal(blockedSetup.ok, false);
  if (!blockedSetup.ok) assert.equal(blockedSetup.status, 409);

  const invalid = auth.login('configured_user', 'wrong');
  assert.equal(invalid.ok, false);

  const valid = auth.login('configured_user', 'configured_password_123');
  assert.equal(valid.ok, true);
});
