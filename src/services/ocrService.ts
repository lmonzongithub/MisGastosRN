export function extractAmountFromText(text: string): number | null {
  const normalized = text.replace(/\s+/g, ' ');

  const totalRegex =
    /(total|importe total|total factura|a pagar|monto)\D{0,40}(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2}))/gi;

  const totalMatches = [...normalized.matchAll(totalRegex)];

  const totalValues = totalMatches
    .map((match) => parseMoney(match[2]))
    .filter((value): value is number => value !== null);

  if (totalValues.length > 0) {
    return Math.max(...totalValues);
  }

  const genericMatches = normalized.match(
    /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2})/g
  );

  if (!genericMatches) return null;

  const values = genericMatches
    .map(parseMoney)
    .filter((value): value is number => value !== null);

  if (values.length === 0) return null;

  return Math.max(...values);
}

function parseMoney(value: string): number | null {
  let clean = value.trim();

  const hasDot = clean.includes('.');
  const hasComma = clean.includes(',');

  if (hasDot && hasComma) {
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');

    if (lastComma > lastDot) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (hasComma) {
    clean = clean.replace(',', '.');
  }

  const parsed = Number(clean);

  return Number.isNaN(parsed) ? null : parsed;
}

export async function extractTextFromReceiptBase64(
  base64: string
): Promise<string> {
  const formData = new FormData();

  formData.append('apikey', 'K88997326988957');
  formData.append('language', 'spa');
  formData.append('isOverlayRequired', 'false');
  formData.append('base64Image', `data:image/jpeg;base64,${base64}`);

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (data?.IsErroredOnProcessing) {
    throw new Error(
      Array.isArray(data.ErrorMessage)
        ? data.ErrorMessage.join(', ')
        : data.ErrorMessage
    );
  }

  return data?.ParsedResults?.[0]?.ParsedText ?? '';
}