import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  AuthState,
  User,
  LoginPayload,
  RegisterPayload,
  VerifyOtpPayload,
  LoginResponse,
  RegisterResponse,
  VerifyOtpResponse,
} from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const initialState: AuthState = {
  user: null,
  token: null,
  otpToken: null,
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk<LoginResponse, LoginPayload>(
  "auth/loginUser",

  async (credentials: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(credentials),

        credentials: "include",
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        return rejectWithValue((data as any).msg || "Login failed. Please try again.");
      }

      return data;

    } catch (error) {
      return rejectWithValue("Network error. Please check your connection.");
    }
  }
);

export const registerUser = createAsyncThunk<RegisterResponse, RegisterPayload>(
  "auth/registerUser",

  async (userData: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok) {
        return rejectWithValue((data as any).msg || "Registration failed.");
      }

      return data;

    } catch (error) {
      return rejectWithValue("Network error. Please check your connection.");
    }
  }
);

export const verifyOtp = createAsyncThunk<VerifyOtpResponse, VerifyOtpPayload>(
  "auth/verifyOtp",

  async (payload: VerifyOtpPayload, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data: VerifyOtpResponse = await response.json();

      if (!response.ok) {
        return rejectWithValue((data as any).message || "OTP verification failed.");
      }

      return data;

    } catch (error) {
      return rejectWithValue("Network error. Please check your connection.");
    }
  }
);

export const rehydrateAuth = createAsyncThunk<User>(
  "auth/rehydrateAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue("Session expired.");
      }

      return data.user as User;

    } catch {
      return rejectWithValue("Could not restore session.");
    }
  }
);

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.otpToken = null;
      state.error = null;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {

    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(
      loginUser.fulfilled,
      (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      }
    );

    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(
      registerUser.fulfilled,
      (state, action: PayloadAction<RegisterResponse>) => {
        state.isLoading = false;
        state.otpToken = action.payload.otpToken;
        state.error = null;
      }
    );

    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(verifyOtp.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(
      verifyOtp.fulfilled,
      (state, action: PayloadAction<VerifyOtpResponse>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.otpToken = null;
        state.error = null;
      }
    );

    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(rehydrateAuth.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      rehydrateAuth.fulfilled,
      (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      }
    );

    builder.addCase(rehydrateAuth.rejected, (state) => {
      state.isLoading = false;
      state.user = null;
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;