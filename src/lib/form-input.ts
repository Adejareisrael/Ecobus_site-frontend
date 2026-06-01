export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function positiveIntegerInput(value: string) {
  return digitsOnly(value).replace(/^0+(?=\d)/, "");
}

export function phoneInput(value: string) {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `${prefix}${digitsOnly(trimmed)}`;
}

export function uppercaseCodeInput(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "").toUpperCase();
}
