"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { loginUser, clearError } from "@/redux/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";


// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LoginFormData {
  email: string;
  password: string;
  // Matches exactly: auth-controllers.js → const { email, password } = req.body
}

interface FormErrors {
  email?: string;
  password?: string;
}


// ─── VALIDATION ───────────────────────────────────────────────────────────────

function validateForm(data: LoginFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!data.password) {
    errors.password = "Password is required.";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}


// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function LoginPage() {

  // ── LOCAL STATE ──
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // ── REDUX ──
  const dispatch = useAppDispatch();
  const { isLoading, error, user } = useAppSelector((state) => state.auth);
  // We read `user` here — not `otpToken` like verify-otp did.
  // loginUser.fulfilled sets state.auth.user directly (no OTP step for login).
  // The moment user becomes non-null → redirect to /chat.

  const router = useRouter();

  // ── EFFECTS ──
  useEffect(() => {
    dispatch(clearError());
  }, []);

  useEffect(() => {
    // If user is already logged in (e.g. they bookmarked /login but have
    // a session), don't show the login page — send them straight to chat.
    if (user) {
      router.replace("/chat");
      // replace: no reason to keep /login in history if they're already in.
    }
  }, [user]);

  // ── HANDLERS ──
  const handleChange = (field: keyof LoginFormData) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    dispatch(loginUser(formData));
    // loginUser(formData) → hits POST /api/auth/login
    // On success: state.auth.user is set → useEffect above fires → router.replace("/chat")
    // On failure: state.auth.error is set → red banner appears below
  };


  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-black/8 bg-white/90 backdrop-blur-sm">
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-black tracking-tighter text-black"
          >
            batchit
          </Link>
          <div className="flex items-center gap-2 text-sm text-black/50">
            No account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-black underline underline-offset-2 hover:text-black/60 transition-colors ml-1"
            >
              Sign up free
            </Link>
          </div>
        </nav>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          {/* ── HEADER ── */}
          <div className="mb-8">
            <Badge
              variant="outline"
              className="mb-4 border-black/15 text-black/40 text-xs tracking-widest uppercase"
            >
              Welcome back
            </Badge>
            <h1 className="text-3xl font-black tracking-tighter text-black mb-2">
              Sign in.
            </h1>
            <p className="text-sm text-black/40">
              Pick up right where you left off.
            </p>
          </div>

          {/* ── ERROR BANNER ── */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
              {/* "Invalid credentials" from your login controller */}
            </div>
          )}

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* ── EMAIL ── */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold tracking-widest uppercase text-black/40"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl text-sm text-black
                    border transition-colors duration-150 outline-none
                    placeholder:text-black/25 bg-white
                    focus:ring-2 focus:ring-black/10 focus:border-black/40
                    ${errors.email
                      ? "border-red-300 bg-red-50/50"
                      : "border-black/15 hover:border-black/30"
                    }
                  `}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 pl-1">{errors.email}</p>
              )}
            </div>

            {/* ── PASSWORD ── */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold tracking-widest uppercase text-black/40"
                >
                  Password
                </label>
                {/* Forgot password sits on the same row as the label.
                    justify-between pushes them to opposite ends. */}
                <button
                  type="button"
                  className="text-xs text-black/30 hover:text-black/60 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange("password")}
                  placeholder="Your password"
                  autoComplete="current-password"
                  // "current-password" → tells the browser this is a login form.
                  // The browser CAN autofill with saved passwords here.
                  // (contrast with register: "new-password" blocks autofill)
                  className={`
                    w-full pl-10 pr-10 py-3 rounded-xl text-sm text-black
                    border transition-colors duration-150 outline-none
                    placeholder:text-black/25 bg-white
                    focus:ring-2 focus:ring-black/10 focus:border-black/40
                    ${errors.password
                      ? "border-red-300 bg-red-50/50"
                      : "border-black/15 hover:border-black/30"
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/25 hover:text-black/50 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 pl-1">{errors.password}</p>
              )}
            </div>

            {/* ── SUBMIT ── */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white hover:bg-black/80 rounded-xl py-6 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

          </form>

          {/* ── DIVIDER ── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-black/30">
                or
              </span>
              {/* This creates the "─── or ───" divider pattern.
                  The border-t line spans full width (absolute positioned).
                  The "or" text sits on top (relative, bg-white hides line behind it). */}
            </div>
          </div>

          {/* ── REGISTER LINK ── */}
          <Button
            variant="outline"
            asChild
            className="w-full border-black/15 text-black hover:bg-black/5 hover:text-black rounded-xl py-6 text-sm"
          >
            <Link href="/register">
              Create a new account
            </Link>
          </Button>

        </div>
      </main>
    </div>
  );
}