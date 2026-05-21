/** عملة الموقع — دينار كويتي (KWD) — متوافق مع بوابة CBK */

export const APP_CURRENCY = {
	code: "KWD",
	symbolAr: "د.ك",
	nameAr: "دينار كويتي",
	decimals: 3,
} as const;

/** تحقق إدخال السعر: حتى 3 خانات عشرية (KWD) */
export const KWD_PRICE_REGEX =
	/^\d+(\.\d{1,3})?$/;

export function parseKwdPrice(
	raw: string,
): string {
	const trimmed = raw.trim();
	return KWD_PRICE_REGEX.test(trimmed)
		? trimmed
		: "0";
}

/** عرض السعر للمستخدم: 12.500 د.ك */
export function formatPriceKwd(
	amount: string | number,
): string {
	const n = Number(amount);
	if (!Number.isFinite(n) || n < 0) {
		return `0.${"0".repeat(APP_CURRENCY.decimals)} ${APP_CURRENCY.symbolAr}`;
	}
	return `${n.toFixed(APP_CURRENCY.decimals)} ${APP_CURRENCY.symbolAr}`;
}

/** مبلغ لبوابة CBK — 3 خانات عشرية */
export function formatAmountForCbk(
	priceDecimalString: string,
): string {
	const n = Number(priceDecimalString);
	if (!Number.isFinite(n) || n < 0) {
		throw new Error("مبلغ غير صالح");
	}
	return n.toFixed(APP_CURRENCY.decimals);
}
