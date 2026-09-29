"use client";

import React, { useRef, useState } from "react";
import { api, ApiError, Business } from "@/lib/api";
import { FloatingField, floatingInputClass } from "../../../components/FormControls";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function ImageUploadSlot({
  label,
  currentUrl,
  aspect,
  onUpload,
}: {
  label: string;
  currentUrl: string | null;
  aspect: "banner" | "profile";
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Use a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setLoading(true);
    try {
      await onUpload(file);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed.");
      setPreview(currentUrl);
    } finally {
      setLoading(false);
    }
  }

  const isBanner = aspect === "banner";

  return (
    <div className="mb-5">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative w-full overflow-hidden border border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition group ${
          isBanner ? "aspect-[3/1]" : "aspect-square max-w-[120px] rounded-full"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400 group-hover:text-gray-600 transition">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs font-medium">
              {loading ? "Uploading…" : `Add ${isBanner ? "banner" : "photo"}`}
            </span>
          </div>
        )}
        {loading && preview && (
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
            Uploading…
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

export function BrandingStep({
  business,
  setBusiness,
  onDone,
}: {
  business: Business;
  setBusiness: (b: Business) => void;
  onDone: () => void;
}) {
  const [bio, setBio] = useState(business.bio ?? "");
  const [bioError, setBioError] = useState<string | null>(null);
  const [savingBio, setSavingBio] = useState(false);

  async function saveBioAndContinue() {
    setBioError(null);
    if (bio.trim().length === 0) {
      onDone();
      return;
    }
    setSavingBio(true);
    try {
      const updated = await api.updateBio(business.id, bio.trim());
      setBusiness(updated);
      onDone();
    } catch (e) {
      setBioError(e instanceof ApiError ? e.message : "Couldn't save that.");
    } finally {
      setSavingBio(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Make it yours
        </h1>
        <p className="text-sm text-gray-500">
          This is what customers see before booking. All optional—skip anything you can add later.
        </p>
      </div>

      <div className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm mb-6">
        <ImageUploadSlot
          label="Banner Image"
          currentUrl={business.banner_url}
          aspect="banner"
          onUpload={async (file) => {
            const updated = await api.uploadBanner(business.id, file);
            setBusiness(updated);
          }}
        />

        <ImageUploadSlot
          label="Profile Photo"
          currentUrl={business.profile_image_url}
          aspect="profile"
          onUpload={async (file) => {
            const updated = await api.uploadProfileImage(business.id, file);
            setBusiness(updated);
          }}
        />

        <div className="mt-6">
          <FloatingField label="Short Bio">
            <textarea
              className={`${floatingInputClass} min-h-[90px] pt-4 resize-none`}
              rows={3}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about your services or business…"
            />
          </FloatingField>
          <div className="text-gray-400 text-xs mt-1 text-right tabular-nums">
            {bio.length}/280
          </div>
        </div>

        {bioError && (
          <p className="text-red-500 text-xs font-medium mt-3">{bioError}</p>
        )}
      </div>

      <button
        type="button"
        onClick={saveBioAndContinue}
        disabled={savingBio}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150 shadow-sm disabled:opacity-50"
      >
        {savingBio ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
