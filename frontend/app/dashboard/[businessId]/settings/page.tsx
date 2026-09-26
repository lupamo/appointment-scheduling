"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { api, Business } from "@/lib/api";

export default function BusinessSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    slug: "",
    payout_method: "phone" as "phone" | "shortcode",
    payout_phone: "",
    mpesa_shortcode: ""
  });

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
          setError("Business not found");
          router.push("/dashboard");
          return;
        }

        setBusiness(foundBusiness);
        setFormData({
          name: foundBusiness.name,
          phone: foundBusiness.phone,
          slug: foundBusiness.slug,
          payout_method: foundBusiness.payout_method as "phone" | "shortcode",
          payout_phone: foundBusiness.payout_phone || "",
          mpesa_shortcode: foundBusiness.mpesa_shortcode || ""
        });
      } catch (err) {
        setError("Failed to load business information");
      } finally {
        setIsLoading(false);
      }
    }

    loadBusiness();
  }, [router, params.businessId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;

    setIsSaving(true);
    setError(null);

    try {
      const businessId = params.businessId as string;
      const updatedBusiness = await api.updateBusiness(businessId, {
        name: formData.name,
        phone: formData.phone,
        slug: formData.slug,
        payout_method: formData.payout_method,
        payout_phone: formData.payout_method === "phone" ? formData.payout_phone : undefined,
        mpesa_shortcode: formData.payout_method === "shortcode" ? formData.mpesa_shortcode : undefined,
      });

      setBusiness(updatedBusiness);
      router.push(`/dashboard/${businessId}`);
    } catch (err) {
      setError("Failed to update business settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  if (error && !business) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-orange-500 text-black px-4 py-2 rounded-sm"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mr-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl text-white">Business Settings</h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Business Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Booking Link Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">yourapp.com/book/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Payout Method</label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="radio"
                    checked={formData.payout_method === "phone"}
                    onChange={() => setFormData({...formData, payout_method: "phone"})}
                  />
                  My M-Pesa Number
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="radio"
                    checked={formData.payout_method === "shortcode"}
                    onChange={() => setFormData({...formData, payout_method: "shortcode"})}
                  />
                  I have a Paybill/Till
                </label>
              </div>
            </div>

            {formData.payout_method === "phone" ? (
              <div>
                <label className="block text-sm text-gray-300 mb-2">Payout Phone</label>
                <input
                  type="text"
                  value={formData.payout_phone}
                  onChange={(e) => setFormData({...formData, payout_phone: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-300 mb-2">M-Pesa Shortcode</label>
                <input
                  type="text"
                  value={formData.mpesa_shortcode}
                  onChange={(e) => setFormData({...formData, mpesa_shortcode: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-700 text-white py-2 rounded-sm hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-orange-500 text-black py-2 rounded-sm hover:bg-orange-600 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}