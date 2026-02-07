type HCaptchaResponse = {
  success: boolean;
  "error-codes"?: string[];
};

const VERIFY_URL = "https://hcaptcha.com/siteverify";

export async function verifyHCaptcha(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ success: boolean; error?: string }> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    return { success: false, error: "Captcha not configured" };
  }

  if (!token) {
    return { success: false, error: "Captcha token missing" };
  }

  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteIp) form.append("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = (await res.json()) as HCaptchaResponse;
    if (!data.success) {
      return { success: false, error: "Captcha verification failed" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Captcha verification failed" };
  }
}
