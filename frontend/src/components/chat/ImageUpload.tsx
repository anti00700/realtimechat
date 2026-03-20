"use client";

import { useRef, useState } from "react";
import { ImageIcon, X, Send, Loader2 } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { fetchChats } from "@/redux/slices/chatSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ImageUploadProps {
  chatId: string;
  onSent: () => void;
}

export default function ImageUpload({ chatId, onSent }: ImageUploadProps) {

  const [preview, setPreview] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };


  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  };


  const handleSend = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("chatId", chatId);
    formData.append("type", "image");

    try {
      const response = await fetch(`${API_URL}/api/messages/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Failed to send image.");
        setIsUploading(false);
        return;
      }

      handleCancel();
      dispatch(fetchChats());
      onSent();

    } catch {
      setError("Network error. Could not upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {preview && (
        <div className="absolute bottom-14 left-0 w-64 bg-white border border-black/10 rounded-2xl shadow-lg overflow-hidden z-10">

          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-cover"
            />
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 px-3 py-2">{error}</p>
          )}

          <div className="px-3 py-2.5 border-t border-black/8">
            <button
              type="button"
              onClick={handleSend}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send photo
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setError(null);
          fileInputRef.current?.click();
        }}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-black/25 hover:text-black/50 hover:bg-black/5 transition-colors flex-shrink-0"
        aria-label="Share image"
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      {error && !preview && (
        <div className="absolute bottom-14 left-0 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-500 whitespace-nowrap z-10">
          {error}
        </div>
      )}

    </div>
  );
}