"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { api, Business } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBusiness() {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const businessId = params.businessId as string;
        const businesses = await api.listMyBusinesses();
        const foundBusiness = businesses.find(b => b.id === businessId);

        if (!foundBusiness) {
          setError("Business not found or you don't have access to it");
          // Redirect to onboard if they don't have any businesses
          if (businesses.length === 0) {
            router.push("/onboard");
          }
        } else {
          setBusiness(foundBusiness);
        }
      } catch (err) {
        setError("Failed to load business information");
      } finally {
        setIsLoading(false);
      }
    }

    loadBusiness();
  }, [router, params.businessId]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/onboard")}
            className="bg-orange-500 text-black px-4 py-2 rounded-sm"
          >
            Go to Onboarding
          </button>
        </div>
      </main>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl text-white">Dashboard</h1>
          <button
            onClick={() => {
              // Clear token and redirect to login
              localStorage.removeItem("booking_mvp_token");
              router.push("/login");
            }}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl text-white mb-4">{business.name}</h2>
          <div className="space-y-2 text-gray-300">
            <p><span className="text-gray-500">Slug:</span> {business.slug}</p>
            <p><span className="text-gray-500">Plan:</span> {business.plan}</p>
            <p><span className="text-gray-500">Payout Method:</span> {business.payout_method}</p>
            {business.mpesa_shortcode && (
              <p><span className="text-gray-500">M-Pesa Shortcode:</span> {business.mpesa_shortcode}</p>
            )}
            {business.payout_phone && (
              <p><span className="text-gray-500">Payout Phone:</span> {business.payout_phone}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              className="w-full bg-gray-700 text-white py-2 rounded-sm hover:bg-gray-600 transition"
              onClick={() => router.push(`/dashboard/${business.id}/settings`)}
            >
              Edit Business Settings
            </button>
            <button
              className="w-full bg-gray-700 text-white py-2 rounded-sm hover:bg-gray-600 transition"
              onClick={() => router.push(`/dashboard/${business.id}/bookings`)}
            >
              View Bookings
            </button>
            <button
              className="w-full bg-gray-700 text-white py-2 rounded-sm hover:bg-gray-600 transition"
              onClick={() => router.push(`/dashboard/${business.id}/services`)}
            >
              Manage Services
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}