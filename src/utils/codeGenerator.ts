export interface HasCode {
  code?: string | null;
}

/**
 * Escapes regex special characters in a string
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Generates the next sequential unique code with a given prefix (e.g. CUS-001, SUP-001).
 *
 * @param items List of entities that contain a `code` property
 * @param prefix Prefix for the code, e.g. "CUS" or "SUP" (default: "CUS")
 * @param currentCode Optional current code. If provided and matches `<PREFIX>-###`, advances to the next number
 * @param digits Minimum number of digits for zero-padding (default: 3)
 * @returns The generated unique code string, e.g. "CUS-001"
 */
export const generateSequentialCode = (
  items: HasCode[] = [],
  prefix: string = "CUS",
  currentCode?: string,
  digits: number = 3,
): string => {
  const cleanPrefix = prefix.replace(/-+$/, "");
  const escapedPrefix = escapeRegex(cleanPrefix);
  const pattern = new RegExp(`^${escapedPrefix}-(\\d+)$`, "i");

  const numbers = items
    .map((item) => {
      const match = item?.code?.match(pattern);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null && !Number.isNaN(n));

  // If user is clicking regenerate and currentCode is already <PREFIX>-xxx, advance to the next number
  if (currentCode && pattern.test(currentCode)) {
    const match = currentCode.match(pattern);
    const currentNum = match ? parseInt(match[1], 10) : 0;
    const maxExisting = numbers.length > 0 ? Math.max(...numbers) : 0;
    let nextNum = Math.max(currentNum, maxExisting) + 1;
    let candidate = `${cleanPrefix}-${String(nextNum).padStart(digits, "0")}`;
    while (
      items.some(
        (item) => item?.code?.toLowerCase() === candidate.toLowerCase(),
      )
    ) {
      candidate = `${cleanPrefix}-${String(++nextNum).padStart(digits, "0")}`;
    }
    return candidate;
  }

  if (numbers.length > 0) {
    let nextNum = Math.max(...numbers) + 1;
    let candidate = `${cleanPrefix}-${String(nextNum).padStart(digits, "0")}`;
    while (
      items.some(
        (item) => item?.code?.toLowerCase() === candidate.toLowerCase(),
      )
    ) {
      candidate = `${cleanPrefix}-${String(++nextNum).padStart(digits, "0")}`;
    }
    return candidate;
  }

  // If no sequential codes exist yet, start checking from 1
  let next = 1;
  let candidate = `${cleanPrefix}-${String(next).padStart(digits, "0")}`;
  while (
    items.some(
      (item) => item?.code?.toLowerCase() === candidate.toLowerCase(),
    )
  ) {
    next++;
    candidate = `${cleanPrefix}-${String(next).padStart(digits, "0")}`;
  }
  return candidate;
};

/**
 * Generates Customer Code (e.g. CUS-001, CUS-002, ...)
 *
 * @param customers List of customers
 * @param currentCode Current code if regenerating
 * @param digits Digit padding length (default: 3)
 */
export const generateCustomerCode = (
  customers: HasCode[] = [],
  currentCode?: string,
  digits: number = 3,
): string => {
  return generateSequentialCode(customers, "CUS", currentCode, digits);
};

/**
 * Generates Supplier Code (e.g. SUP-001, SUP-002, ...)
 *
 * @param suppliers List of suppliers
 * @param currentCode Current code if regenerating
 * @param digits Digit padding length (default: 3)
 */
export const generateSupplierCode = (
  suppliers: HasCode[] = [],
  currentCode?: string,
  digits: number = 3,
): string => {
  return generateSequentialCode(suppliers, "SUP", currentCode, digits);
};

export default {
  generateSequentialCode,
  generateCustomerCode,
  generateSupplierCode,
};
