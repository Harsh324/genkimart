"use client";

import HeaderOne from "@/components/header/HeaderOne";
import FooterOne from "@/components/footer/FooterOne";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resendVerificationEmail, verifyEmail } from "@/lib/authApi";
import { toast } from "react-toastify";

export default function VerifyEmailPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const email = sp.get("email") || "";
  const key = sp.get("key"); // support direct confirmation if you route the email link here

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Optional: if your email link can point to this page with ?key=...
  useEffect(() => {
    const run = async () => {
      if (!key) return;
      try {
        setVerifying(true);
        await verifyEmail(key);
        toast.success("Email verified! You can now sign in.");
        router.replace("/login");
      } catch (e: any) {
        const msg = e?.response?.data || "Verification failed";
        toast.error(typeof msg === "string" ? msg : "Verification failed");
      } finally {
        setVerifying(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const onResend = async () => {
    if (!email) {
      toast.info("Enter your email on the Register page to receive a verification email.");
      return;
    }
    try {
      setSending(true);
      await resendVerificationEmail(email);
      toast.success("Verification email resent. Check your inbox.");
    } catch (e: any) {
      const msg = e?.response?.data || "Could not resend verification email";
      toast.error(typeof msg === "string" ? msg : "Could not resend verification email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="demo-one">
      <HeaderOne />

      <div className="rts-navigation-area-breadcrumb bg_light-1">
        <div className="container">
          <div className="navigator-breadcrumb-wrapper">
            <a href="/">Home</a>
            <i className="fa-regular fa-chevron-right" />
            <a className="current" href="/verify-email">Verify Email</a>
          </div>
        </div>
      </div>

      <div className="rts-register-area rts-section-gap bg_light-1">
        <div className="container">
          <div className="registration-wrapper-1" style={{ maxWidth: 560, margin: "0 auto" }}>
            <div className="logo-area mb--0">
              <img className="mb--10" src="/assets/images/logo/fav.png" alt="logo" />
            </div>
            <h3 className="title">Check your email</h3>
            <p className="mb--20">
              We’ve sent a verification link to <strong>{email || "your email"}</strong>. Click the link to activate your account.
            </p>

            {!key && (
              <button
                onClick={onResend}
                className="rts-btn btn-primary"
                disabled={sending}
              >
                {sending ? "Sending..." : "Resend verification email"}
              </button>
            )}

            {verifying && <p className="mt--15">Verifying...</p>}

            <p className="mt--20">
              Already verified? <a href="/login">Sign in</a>
            </p>
          </div>
        </div>
      </div>

      <FooterOne />
    </div>
  );
}
