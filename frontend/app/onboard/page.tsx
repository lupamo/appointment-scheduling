"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";

// Dynamically import OnboardWizard with SSR disabled to eliminate hydration mismatches
const OnboardWizard = dynamic(() => import("./_components/OnboardWizard").then(m => m.OnboardWizard), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen flex items-center justify-center bg-gray-50" suppressHydrationWarning>
      <div className="flex items-center gap-2.5 text-gray-500 text-sm font-medium" suppressHydrationWarning>
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" suppressHydrationWarning />
        <span>Loading...</span>
      </div>
    </main>
  ),
});

export default function OnboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowOnboard, setShouldShowOnboard] = useState(false);

  useEffect(() => {
    async function checkUserStatus() {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Check if user already has businesses
        const businesses = await api.listMyBusinesses();
        if (businesses && businesses.length > 0) {
          router.push(`/dashboard/${businesses[0].id}`);
          return;
        }
        setShouldShowOnboard(true);
      } catch (error) {
        setShouldShowOnboard(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkUserStatus();
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50" suppressHydrationWarning>
        <div className="flex items-center gap-2.5 text-gray-500 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </main>
    );
  }

  if (!shouldShowOnboard) {
    return null;
  }

  return <OnboardWizard />;
} 