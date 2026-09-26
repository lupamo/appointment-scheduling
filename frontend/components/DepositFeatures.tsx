"use client";

import Image from "next/image";
import Link from 'next/link';
import { CircleCheckBig } from "lucide-react";

export default function DepositFeatures() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-16 lg:px-24 bg-[#f8faff] text-slate-900">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        
        {/* Left Section: Image and Stats Card */}
        <div className="relative group">
          <div className="relative z-10 w-full rounded-3xl overflow-hidden aspect-[1/1.1] border-4 border-white shadow-booking-card">
            <Image
              src="/features.png"
              alt="Securing Bookings"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              priority
            />
          </div>

          {/* Floating Stats Card (Matches structure of image_1.png) */}
          <div className="absolute -bottom-10 -right-6 md:-bottom-12 md:-right-10 z-20 bg-white p-6 md:p-8 rounded-2xl shadow-2xl shadow-blue-500/15 border border-slate-100 flex flex-col gap-6 w-[280px] md:w-[320px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-[#4F73EE]">99%</p>
                <p className="text-sm md:text-base text-slate-500 font-medium">Reduced No-Shows</p>
              </div>
            </div>
            
            <div className="w-60 md:w-80 md:mt-2.5 border-t border-slate-100 pt-6">
              <p className="text-3xl md:text-4xl font-extrabold text-slate-900">KES 10k+</p>
              <p className="text-sm md:text-base text-slate-500 font-medium">Secured Deposits This Month</p>
            </div>
          </div>
        </div>

        {/* Right Section: Content */}
        <div className="flex flex-col items-start gap-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight">
            Secure every <span className="text-[#4F73EE]">booking</span>, minimize every <span className="text-[#FA5858]">risk</span>.
          </h2>

          <p className="text-slate-500 text-lg md:text-xl leading-relaxed max-w-2xl">
            You set the terms, we handle the security. Your clients can&apos;t hold a slot until they confirm commitment with a secure deposit. Stop losing time and chairs to last-minute cancellations.
          </p>

          <ul className="space-y-5 text-base md:text-lg text-slate-800 font-medium">
            <li className="flex items-center gap-3.5">
              <CircleCheckBig className="w-7 h-7 text-[#22c55e] shrink-0" />
              Required up-front deposits for all reservations.
            </li>
            <li className="flex items-center gap-3.5">
              <CircleCheckBig className="w-7 h-7 text-[#22c55e] shrink-0" />
              Clients must authorize payment *before* they can confirm.
            </li>
            <li className="flex items-center gap-3.5">
              <CircleCheckBig className="w-7 h-7 text-[#22c55e] shrink-0" />
              Automated confirmation once the deposit clears.
            </li>
          </ul>

          <Link href="/onboard" className="mt-6 px-9 py-4 bg-[#4F73EE] hover:bg-blue-600 text-white font-semibold text-lg rounded-xl transition-all duration-200 shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-2.5">
            Start Securing Today
          </Link>
        </div>

      </div>
    </section>
  );
}