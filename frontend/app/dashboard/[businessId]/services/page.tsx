"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { api, Business, Service } from "@/lib/api";

export default function ServicesPage() {
  const router = useRouter();
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    duration_minutes: 30,
    price_kes: 1000,
    deposit_kes: 200
  });

  useEffect(() => {
    async function loadData() {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const businessId = params.businessId as string;
        const [businesses, servicesData] = await Promise.all([
          api.listMyBusinesses(),
          api.listServices(businessId)
        ]);

        const foundBusiness = businesses.find(b => b.id === businessId);
        if (!foundBusiness) {
          setError("Business not found");
          router.push("/dashboard");
          return;
        }

        setBusiness(foundBusiness);
        setServices(servicesData);
      } catch (err) {
        setError("Failed to load services");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router, params.businessId]);

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    const businessId = params.businessId as string;

    try {
      const service = await api.createService(businessId, newService);
      setServices([...services, service]);
      setNewService({ name: "", duration_minutes: 30, price_kes: 1000, deposit_kes: 200 });
      setShowAddForm(false);
    } catch (err) {
      setError("Failed to add service");
    }
  }

  async function handleDeactivateService(serviceId: string) {
    const businessId = params.businessId as string;
    try {
      await api.deleteService(businessId, serviceId);
      setServices(services.filter(s => s.id !== serviceId));
    } catch (err) {
      setError("Failed to deactivate service");
    }
  }

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white mr-4"
            >
              ← Back
            </button>
            <h1 className="text-2xl text-white">Services</h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-500 text-black px-4 py-2 rounded-sm hover:bg-orange-600 transition"
          >
            {showAddForm ? "Cancel" : "Add Service"}
          </button>
        </div>

        {business && (
          <div className="mb-6">
            <p className="text-gray-400">{business.name}</p>
          </div>
        )}

        {showAddForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg text-white mb-4">Add New Service</h3>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Service Name</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService({...newService, duration_minutes: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Price (KES)</label>
                <input
                  type="number"
                  value={newService.price_kes}
                  onChange={(e) => setNewService({...newService, price_kes: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Deposit (KES)</label>
                <input
                  type="number"
                  value={newService.deposit_kes}
                  onChange={(e) => setNewService({...newService, deposit_kes: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                  min="1"
                  max={newService.price_kes}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 text-black py-2 rounded-sm hover:bg-orange-600 transition"
              >
                Add Service
              </button>
            </form>
          </div>
        )}

        {services.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No services yet</p>
            <p className="text-gray-500 text-sm">
              Add services to start accepting bookings
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left text-gray-300 px-4 py-3">Service Name</th>
                  <th className="text-left text-gray-300 px-4 py-3">Duration</th>
                  <th className="text-left text-gray-300 px-4 py-3">Price</th>
                  <th className="text-left text-gray-300 px-4 py-3">Deposit</th>
                  <th className="text-left text-gray-300 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t border-gray-700">
                    <td className="px-4 py-3 text-white">{service.name}</td>
                    <td className="px-4 py-3 text-gray-300">{service.duration_minutes} min</td>
                    <td className="px-4 py-3 text-gray-300">KES {service.price_kes}</td>
                    <td className="px-4 py-3 text-gray-300">KES {service.deposit_kes}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeactivateService(service.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Deactivate
                      </button>
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