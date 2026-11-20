const STROOPS_PER_XLM = 10_000_000n;

export function stroopsToXlm(stroops: string | number | bigint): string {
  try {
    const value = BigInt(stroops);
    const negative = value < 0n;
    const abs = negative ? -value : value;
    const whole = abs / STROOPS_PER_XLM;
    const frac = abs % STROOPS_PER_XLM;
    if (frac === 0n) {
      return `${negative ? "-" : ""}${whole.toString()}`;
    }
    const fracStr = frac.toString().padStart(7, "0").replace(/0+$/, "");
    return `${negative ? "-" : ""}${whole.toString()}.${fracStr}`;
  } catch {
    return "0";
  }
}

export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return "unknown";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: string | number): string {
  const str = typeof amount === "number" ? amount.toString() : amount;
  const num = Number(str);
  if (!Number.isFinite(num)) return str;
  const [intPart, decPart] = str.split(".");
  const formattedInt = Number(intPart).toLocaleString("en-US");
  if (!decPart) return formattedInt;
  const trimmedDec = decPart.replace(/0+$/, "");
  return trimmedDec ? `${formattedInt}.${trimmedDec}` : formattedInt;
}

export function formatDateShort(iso?: string): string {
  if (!iso) return "unknown time";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "unknown time";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function sumDecimalStrings(amounts: string[]): string {
  let totalScaled = 0n;
  for (const raw of amounts) {
    const cleaned = raw.trim();
    if (!cleaned) continue;
    const negative = cleaned.startsWith("-");
    const unsigned = negative ? cleaned.slice(1) : cleaned;
    const [wholeStr = "0", fracStr = ""] = unsigned.split(".");
    const paddedFrac = fracStr.slice(0, 7).padEnd(7, "0");
    const scaled =
      BigInt(wholeStr || "0") * STROOPS_PER_XLM + BigInt(paddedFrac || "0");
    totalScaled += negative ? -scaled : scaled;
  }
  return stroopsToXlm(totalScaled);
}
