export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
}

export function isNotEmpty(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function isValidRole(role) {
  return ['admin', 'student'].includes(role);
}

export function isValidPriority(priority) {
  return ['low', 'medium', 'high', 'critical'].includes(priority);
}

export function isValidStatus(status, validStatuses) {
  return validStatuses.includes(status);
}
