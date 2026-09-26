"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Field, inputClass } from "@/components/Field";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await api.signup(email, password);
      setToken(access_token);

      // New users won't have businesses, so go to onboarding
      router.push("/onboard");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="max-w-sm w-full">
        <h1 className="text-2xl mb-1 text-white">Create your account</h1>
        <p className="text-gray-400 text-sm mb-8">
          Set up your business booking page in a few minutes.
        </p>

        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </Field>
        <p className="text-gray-500 text-xs -mt-4 mb-5">At least 8 characters.</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-black font-medium py-3 rounded-sm hover:bg-orange-600 transition disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-gray-400 text-sm text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-500 hover:text-orange-400">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}