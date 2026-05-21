function trimBase(url: string): string {
	return url.replace(/\/+$/, "");
}

export interface CbkCredentials {
	pgBaseUrl: string;
	clientId: string;
	clientSecret: string;
	encrpKey: string;
	currency: string;
	paymentLang: "ar" | "en";
	payType: "" | "1" | "2";
}

function resolveCbkBaseUrl(): string {
	return (
		process.env.CBK_PG_BASE_URL?.trim() ||
		process.env.CBK_BASE_URL?.trim() ||
		""
	);
}

export function isCbkPaymentConfigured(): boolean {
	return !!(
		resolveCbkBaseUrl() &&
		process.env.CBK_CLIENT_ID?.trim() &&
		process.env.CBK_CLIENT_SECRET?.trim() &&
		process.env.CBK_ENCRP_KEY?.trim()
	);
}

export function getCbkCredentials(): CbkCredentials {
	if (!isCbkPaymentConfigured()) {
		throw new Error(
			"إعدادات CBK غير مكتملة (CBK_PG_BASE_URL / CBK_BASE_URL وغيرها)",
		);
	}
	const cur = (process.env.CBK_CURRENCY ?? "KWD")
		.trim()
		.toUpperCase();
	const langRaw = (
		process.env.CBK_PAYMENT_LANG ?? "ar"
	)
		.trim()
		.toLowerCase();
	const paymentLang =
		langRaw === "en" ? "en" : "ar";
	const payRaw = (
		process.env.CBK_PAY_TYPE ?? ""
	).trim();
	const payType =
		payRaw === "1" || payRaw === "2"
			? (payRaw as "1" | "2")
			: "";

	return {
		pgBaseUrl: trimBase(resolveCbkBaseUrl()),
		clientId: process.env.CBK_CLIENT_ID!.trim(),
		clientSecret:
			process.env.CBK_CLIENT_SECRET!.trim(),
		encrpKey: process.env.CBK_ENCRP_KEY!.trim(),
		currency: cur,
		paymentLang,
		payType,
	};
}

export function getAppPublicBaseUrl(): string {
	const raw =
		process.env.AUTH_URL?.trim() ||
		process.env.APP_URL?.trim() ||
		process.env.NEXT_PUBLIC_APP_URL?.trim() ||
		"";
	if (!raw) {
		throw new Error(
			"عيّن APP_URL أو NEXT_PUBLIC_APP_URL لرابط العودة من البوابة",
		);
	}
	return trimBase(raw);
}

/** رابط عودة CBK — CBK_RETURN_URL أو APP_URL + مسار الإرجاع */
export function getCbkReturnUrl(): string {
	const explicit =
		process.env.CBK_RETURN_URL?.trim();
	if (explicit) return trimBase(explicit);
	return `${getAppPublicBaseUrl()}/api/v1/payments/cbk/return`;
}
