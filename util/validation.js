function isValidText(value, minLength = 2, maxLength = 30) {
  return (
    value &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength &&
    /^\p{L}+$/u.test(value)
  );
}

function isValidUsername(value, minLength = 6, maxLength = 16) {
  return (
    value &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /^[a-zA-Z0-9]*$/.test(value) &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength
  );
}

function isValidPassword(value, minLength = 8, maxLength = 16) {
  return (
    value &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[$&+,:;=?@#|'"<>.⌃*()%!-_]/.test(value)
  );
}

exports.isValidText = isValidText;
exports.isValidUsername = isValidUsername;
exports.isValidPassword = isValidPassword;
