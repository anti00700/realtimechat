"use client";


import { useState, useEffect } from "react";


import { useRouter } from "next/navigation";


import Link from "next/link";


import { useAppDispatch, useAppSelector } from "@/redux/hooks";


import { registerUser, clearError } from "@/redux/slices/authSlice";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


import { Loader2, User, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";





interface RegisterFormData {
  username: string;
  email: string;
  password: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;

}



function validateForm(data: RegisterFormData): FormErrors {


  const errors: FormErrors = {};


  if (!data.username.trim()) {
    errors.username = "Username is required.";
  } else if (data.username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters.";
  } else if (data.username.trim().length > 30) {
    errors.username = "Username must be under 30 characters.";
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = "Username can only contain letters, numbers, and underscores.";
  }

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




export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
  });


  const [errors, setErrors] = useState<FormErrors>({});


  const [showPassword, setShowPassword] = useState<boolean>(false);


  const dispatch = useAppDispatch();


  const { isLoading, error, otpToken } = useAppSelector(
    (state) => state.auth
  );

  const router = useRouter();

  useEffect(() => {
    dispatch(clearError());
  }, []);
  useEffect(() => {
    if (otpToken) {
      router.push("/verify-otp");
    }
  }, [otpToken]);

  const handleChange = (field: keyof RegisterFormData) => {

    return (e: React.ChangeEvent<HTMLInputElement>) => {

      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));


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

    dispatch(registerUser(formData));
  };




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
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-black underline underline-offset-2 hover:text-black/60 transition-colors ml-1"
            >
              Sign in
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
              Create account
            </Badge>
            <h1 className="text-3xl font-black tracking-tighter text-black mb-2">
              Join batchit.
            </h1>

          </div>


          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}


          <form onSubmit={handleSubmit} noValidate className="space-y-4">


            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-xs font-semibold tracking-widest uppercase text-black/40"
              >
                Username
              </label>

              <div className="relative">

                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 pointer-events-none"
                />

                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange("username")}
                  placeholder="e.g. john_doe"
                  autoComplete="username"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl text-sm text-black
                    border transition-colors duration-150 outline-none
                    placeholder:text-black/25 bg-white
                    focus:ring-2 focus:ring-black/10 focus:border-black/40
                    ${errors.username
                      ? "border-red-300 bg-red-50/50"
                      : "border-black/15 hover:border-black/30"
                    }
                  `}
                />
              </div>

              {errors.username && (
                <p className="text-xs text-red-500 pl-1">{errors.username}</p>
              )}
            </div>


            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold tracking-widest uppercase text-black/40"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 pointer-events-none"
                />
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


            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold tracking-widest uppercase text-black/40"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange("password")}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
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


            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white hover:bg-black/80 rounded-xl py-6 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

          </form>


          <p className="mt-6 text-center text-xs text-black/30 leading-relaxed">
            By creating an account you agree to our{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-black/50 transition-colors">
              terms of service
            </span>
            .
          </p>

        </div>
      </main>
    </div>
  );
}