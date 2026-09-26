"use client";

import { useRef } from "react";
import Link from 'next/link';
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Heart, Star, Lightbulb } from "lucide-react";

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Floating animation for primary badges
      gsap.to(".floating-icon", {
        y: "-=12",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.4,
          from: "random",
        },
      });

      // Subtle float + gentle scale effect for small decorative dots
      gsap.to(".floating-dot", {
        y: "-=8",
        scale: 1.15,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.3,
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
     className="flex items-start justify-center bg-[#f8faff] px-6 pt-1 pb-12 md:px-16 lg:px-24 overflow-hidden"
    >
      <div className="w-full max-w-6xl grid  grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        
        {/* Left Section: Content */}
        <div className="flex flex-col items-start gap-6 max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
             A{" "}
            <span className="relative inline-block">
              Deposit
              <span className="absolute left-0 bottom-1 w-full h-0.75 bg-amber-400 rounded-full" />
            </span>{" "}
            Backed booking
          </h1>

          <p className="text-slate-500 text-base md:text-lg leading-relaxed">
            A slot is&apos;t booked until it&apos;s paid for! Set up your business, share one link, and stop losing chairs to no-shows.
          </p>

          <Link href="/onboard"className="mt-2 px-8 py-3.5 bg-[#4F73EE] hover:bg-blue-600 text-white font-medium text-base rounded-lg transition-colors duration-200 shadow-md shadow-blue-500/20 active:scale-95">
            Get Started
          </Link>
        </div>

        {/* Right Section: Image & Floating Elements */}
        <div className="relative flex justify-center items-center w-full min-h-105 md:min-h-125">
          
          {/* Blue Background Circle */}
          <div className="absolute w-70 h-70 sm:w-90 sm:h-90 md:w-100 md:h-100 bg-header rounded-full shadow-2xl shadow-blue-500/10" />

          {/* Character Image */}
          <div className="relative z-10 w-75 sm:w-95 md:w-105 h-auto bottom-2">
            <Image
              src="/homepage.png" // Replace with your image path
              alt="3D Character Advisor"
              width={500}
              height={500}
              priority
              className="object-contain drop-shadow-xl"
            />
          </div>

          {/* Floating Badges */}
          
          {/* Heart Badge (Top-Left) */}
          <div className="floating-icon absolute top-8 left-[8%] sm:left-[12%] z-20 w-12 h-12 md:w-14 md:h-14 bg-[#5078F2] rounded-full flex items-center justify-center shadow-lg text-white">
            <Heart className="w-6 h-6 fill-current" />
          </div>

          {/* Star Badge (Top-Right) */}
          <div className="floating-icon absolute top-16 right-[6%] sm:right-[10%] z-20 w-11 h-11 md:w-13 md:h-13 bg-[#FA5858] rounded-full flex items-center justify-center shadow-lg text-white">
            <Star className="w-5 h-5 fill-current" />
          </div>

          {/* Lightbulb Badge (Mid-Left) */}
          <div className="floating-icon absolute bottom-24 left-[2%] sm:left-[6%] z-20 w-11 h-11 md:w-12 md:h-12 bg-[#F6C644] rounded-full flex items-center justify-center shadow-lg text-white">
            <Lightbulb className="w-5 h-5 fill-current" />
          </div>

          {/* Decorative Floating Dots */}
          <div className="floating-dot absolute top-24 left-[28%] w-2.5 h-2.5 bg-[#6384F6] rounded-full" />
          <div className="floating-dot absolute top-12 right-[28%] w-3.5 h-3.5 bg-[#4A72F5] rounded-full" />
          <div className="floating-dot absolute bottom-32 right-[8%] w-2.5 h-2.5 bg-[#5277F3] rounded-full" />
        </div>

      </div>
    </section>
  );
}