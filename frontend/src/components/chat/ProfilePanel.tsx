"use client";

import { useRef, useState } from "react";
import { X, Camera, Loader2, Check } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { loginUser } from "@/redux/slices/authSlice";
import type { User } from "@/types/auth";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {

  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPic, setLocalPic] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setError(null);
    setUploadSuccess(false);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const response = await fetch(`${API_URL}/api/auth/update-profile-pic`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Upload failed.");
        return;
      }

      setLocalPic(data.user.profilePic);
      setUploadSuccess(true);

      const stored = localStorage.getItem("nexus_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          "nexus_user",
          JSON.stringify({ ...parsed, profilePic: data.user.profilePic })
        );
      }

      setTimeout(() => setUploadSuccess(false), 2000);

    } catch {
      setError("Network error. Could not upload.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const avatarSrc = localPic || user?.profilePic || null;
  const initial = (user?.displayName || user?.username || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-white z-50 flex flex-col",
          "shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >

        <div className="h-16 px-5 flex items-center justify-between border-b border-black/8 flex-shrink-0">
          <h2 className="text-sm font-bold text-black tracking-tight">
            Profile
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:text-black hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-8">

          <div className="flex flex-col items-center mb-8">

            <div className="relative group mb-4">
              <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center overflow-hidden">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-black">
                    {initial}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : uploadSuccess ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white mb-1" />
                    <span className="text-white text-[10px] font-medium">
                      Change
                    </span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <p className="text-xs text-black/30 text-center">
              Hover over your picture to change it
            </p>

            {error && (
              <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
            )}

            {uploadSuccess && (
              <p className="text-xs text-green-600 mt-2 text-center font-medium">
                ✓ Profile picture updated
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-widest uppercase text-black/30">
                Username
              </label>
              <div className="px-4 py-3 rounded-xl bg-black/4 border border-black/8">
                <p className="text-sm text-black font-medium">
                  @{user?.username}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-widest uppercase text-black/30">
                Email
              </label>
              <div className="px-4 py-3 rounded-xl bg-black/4 border border-black/8">
                <p className="text-sm text-black truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-widest uppercase text-black/30">
                Member Since
              </label>
              <div className="px-4 py-3 rounded-xl bg-black/4 border border-black/8">
                <p className="text-sm text-black">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString([], {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="px-5 py-4 border-t border-black/8 flex-shrink-0">
          <p className="text-[11px] text-black/20 text-center">
            batchit · your account
          </p>
        </div>

      </div>
    </>
  );
}