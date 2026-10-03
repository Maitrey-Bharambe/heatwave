// Server-side input validation (client forms mirror these rules for instant feedback).
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+?[0-9][0-9\s-]{8,14}$/;

export function passwordProblems(pw) {
  const p = [];
  if (!pw || pw.length < 8) p.push('at least 8 characters');
  if (!/[A-Za-z]/.test(pw || '')) p.push('a letter');
  if (!/[0-9]/.test(pw || '')) p.push('a number');
  if (pw && pw.length > 72) p.push('at most 72 characters');
  return p;
}

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Validates profile fields shared by registration and profile update. */
export function validateProfile(body) {
  const errors = {};
  const data = {
    fullName: clean(body.fullName, 100),
    phoneNumber: clean(body.phoneNumber, 20),
    city: clean(body.city, 100),
    stateCode: clean(body.stateCode, 4).toUpperCase(),
  };
  if (data.fullName.length < 2) errors.fullName = 'Enter your full name.';
  if (!PHONE_RE.test(data.phoneNumber)) errors.phoneNumber = 'Enter a valid phone number (10–15 digits).';
  if (data.city.length < 2) errors.city = 'Enter your city.';
  if (!data.stateCode) errors.stateCode = 'Select your state.';
  return { data, errors };
}

export function validateRegistration(body) {
  const { data, errors } = validateProfile(body);
  data.email = clean(body.email, 255).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!EMAIL_RE.test(data.email)) errors.email = 'Enter a valid email address.';
  const problems = passwordProblems(password);
  if (problems.length) errors.password = `Password needs ${problems.join(', ')}.`;
  if (password !== body.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return { data, password, errors };
}
