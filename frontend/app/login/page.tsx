"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Field, inputClass } from "@/components/Field";

export default function LoginPage() {
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
      const { access_token } = await api.login(email, password);
      setToken(access_token);

      // Check if user already has businesses
      const businesses = await api.listMyBusinesses();
      if (businesses.length > 0) {
        // Redirect to dashboard if they have businesses
        router.push(`/dashboard/${businesses[0].id}`);
      } else {
        // Redirect to onboarding if they don't have businesses
        router.push("/onboard");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="max-w-sm w-full">
        <h1 className="text-2xl mb-1 text-white">Log in to your account</h1>
        <p className="text-gray-400 text-sm mb-8">
          Welcome back to your business booking page.
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
            required
          />
        </Field>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-black font-medium py-3 rounded-sm hover:bg-orange-600 transition disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="text-gray-400 text-sm text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/sign_up" className="text-orange-500 hover:text-orange-400">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}