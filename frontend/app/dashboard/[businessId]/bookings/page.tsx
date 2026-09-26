"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { api, Business, Booking } from "@/lib/api";

export default function BookingsPage() {
  const router = useRouter();
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const businessId = params.businessId as string;
        const [businesses, bookingsData] = await Promise.all([
          api.listMyBusinesses(),
          api.listBookings(businessId)
        ]);

        const foundBusiness = businesses.find(b => b.id === businessId);
        if (!foundBusiness) {
          setError("Business not found");
          router.push("/dashboard");
          return;
        }

        setBusiness(foundBusiness);
        setBookings(bookingsData);
      } catch (err) {
        setError("Failed to load bookings");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mr-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl text-white">Bookings</h1>
        </div>

        {business && (
          <div className="mb-6">
            <p className="text-gray-400">{business.name}</p>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No bookings yet</p>
            <p className="text-gray-500 text-sm">
              Share your booking link to start receiving bookings
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left text-gray-300 px-4 py-3">Customer</th>
                  <th className="text-left text-gray-300 px-4 py-3">Date & Time</th>
                  <th className="text-left text-gray-300 px-4 py-3">Status</th>
                  <th className="text-left text-gray-300 px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-gray-700">
                    <td className="px-4 py-3 text-white">{booking.customer_name}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(booking.slot_start).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        booking.status === 'confirmed' ? 'bg-green-600 text-white' :
                        booking.status === 'pending_payment' ? 'bg-yellow-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {booking.mpesa_receipt_number || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}