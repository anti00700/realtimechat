export interface User {
  _id: string;
  username: string;
  email: string;
  profilePic: string;
  displayName?: string;
  isAdmin: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  otpToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  otp: string;
  otpToken: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  msg: string;
  otpToken: string;
}

export interface VerifyOtpResponse {
  message: string;
  user: User;
}