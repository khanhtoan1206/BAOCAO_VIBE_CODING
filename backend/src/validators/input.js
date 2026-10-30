export function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
export function integer(value, min = 1, max = 2147483647) {
  if (!/^\d+$/.test(String(value))) fail('Giá trị số không hợp lệ.');
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min || result > max) fail('Giá trị nằm ngoài phạm vi cho phép.');
  return result;
}
export function text(value, min = 1, max = 200) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(`Nội dung phải có ${min}–${max} ký tự.`);
  return value.trim();
}