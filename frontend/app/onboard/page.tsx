"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { OnboardWizard } from "./_components/OnboardWizard";


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
        if (businesses.length > 0) {
          // Redirect to dashboard if they have businesses
          router.push(`/dashboard/${businesses[0].id}`);
        } else {
          // Show onboarding if they don't have businesses
          setShouldShowOnboard(true);
        }
      } catch (error) {
        // If there's an error, still show onboarding
        setShouldShowOnboard(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkUserStatus();
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  if (!shouldShowOnboard) {
    return null; // Will redirect
  }

  return <OnboardWizard />
}
