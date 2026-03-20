"use client";

import { useState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { verifyOtp, clearError } from "@/redux/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, RotateCcw } from "lucide-react";


const OTP_LENGTH = 6;


export default function VerifyOtpPage() {

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));

  const inputRefs = useRef<(HTMLInputElement | null)[]>(
    Array(OTP_LENGTH).fill(null)
  );

  const dispatch = useAppDispatch();

  const { isLoading, error, otpToken, user } = useAppSelector(
    (state) => state.auth
  );

  const router = useRouter();

  useEffect(() => {
    dispatch(clearError());
  }, []);

  useEffect(() => {
    if (!otpToken) {
      router.replace("/register");
    }
  }, [otpToken]);

  useEffect(() => {
    if (user) {
      router.push("/chat");
    }
  }, [user]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);


  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pasted)) return;

    const digits = pasted.slice(0, OTP_LENGTH).split("");
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);

    const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const otpString = otp.join("");

    if (otpString.length < OTP_LENGTH) {
      const firstEmpty = otp.findIndex((digit) => digit === "");
      inputRefs.current[firstEmpty]?.focus();
      return;
    }

    if (!otpToken) return;

    dispatch(verifyOtp({ otp: otpString, otpToken }));
  };

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    dispatch(clearError());
    inputRefs.current[0]?.focus();
  };

  const otpValue = otp.join("");
  const isComplete = otpValue.length === OTP_LENGTH;


  return (
    <div className="min-h-screen bg-white flex flex-col">

      <header className="sticky top-0 z-50 border-b border-black/8 bg-white/90 backdrop-blur-sm">
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-black tracking-tighter text-black"
          >
            batchit
          </Link>
          <div className="flex items-center gap-2 text-sm text-black/50">
            Wrong email?{" "}
            <Link
              href="/register"
              className="font-semibold text-black underline underline-offset-2 hover:text-black/60 transition-colors ml-1"
            >
              Go back
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          <div className="mb-8">
            <Badge
              variant="outline"
              className="mb-4 border-black/15 text-black/40 text-xs tracking-widest uppercase"
            >
              Verification
            </Badge>
            <h1 className="text-3xl font-black tracking-tighter text-black mb-2">
              Check your email.
            </h1>
            <p className="text-sm text-black/40 leading-relaxed">
              We sent a 6-digit code to your email address. Enter it below to
              complete your account setup.
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className="flex gap-2 justify-between mb-6">
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <input
                  key={index}

                  ref={(el) => { inputRefs.current[index] = el; }}

                  type="text"
                  inputMode="numeric"

                  maxLength={1}

                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}

                  className={`
                    w-11 h-14 text-center text-xl font-bold text-black rounded-xl
                    border transition-all duration-150 outline-none
                    caret-transparent
                    focus:ring-2 focus:ring-black/10 focus:border-black/40
                    ${otp[index]
                      ? "border-black/40 bg-black/3"
                      : "border-black/15 bg-white"
                    }
                    ${error ? "border-red-300" : ""}
                  `}
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !isComplete}
              className="w-full bg-black text-white hover:bg-black/80 rounded-xl py-6 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify and continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-black/30 mb-2">
              Didn&apos;t receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              className="text-xs font-semibold text-black/50 hover:text-black flex items-center gap-1.5 mx-auto transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Clear and try again
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}