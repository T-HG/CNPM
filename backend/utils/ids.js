export function nextCode(prefix, value) {
  return `${prefix}${String(value).padStart(6, '0')}`
}

export function invoiceCode() {
  return `HD${Date.now()}`
}

export function lineCode(index) {
  return `CT${Date.now()}${String(index + 1).padStart(2, '0')}`
}
