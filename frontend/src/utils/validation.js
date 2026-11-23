const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

// Mirrors backend/schemas.py UserCreate: full_name 2-100 chars, password 8-128 chars.
export function validateSignup({ full_name, email, password, confirm }) {
  const errors = {};
  const name = full_name.trim();
  if (!name) errors.full_name = 'Full name is required.';
  else if (name.length < 2) errors.full_name = 'Name must be at least 2 characters.';
  else if (name.length > 100) errors.full_name = 'Name must be 100 characters or fewer.';

  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (password.length > 128) errors.password = 'Password must be 128 characters or fewer.';

  if (!confirm) errors.confirm = 'Please confirm your password.';
  else if (confirm !== password) errors.confirm = 'Passwords do not match.';
  return errors;
}
