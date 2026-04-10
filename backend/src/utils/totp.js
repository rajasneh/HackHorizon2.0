import speakeasy from 'speakeasy';

export function generateSecret(email) {
  const secret = speakeasy.generateSecret({ name: `TktPlz (${email})` });
  return secret;
}

export function verifyTOTP(token, secret) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}