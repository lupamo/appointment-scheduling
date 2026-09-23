import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full text-center">
        <p className="text-6xl font-bold mb-3">
          Deposit-backed Booking <br/> A slot is&apos;t booked until it&apos;s <span className="relative inline-block px-4 py-1">
            <svg
              className="absolute inset-0 -z-10 h-full w-full"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
            >
              <path
                d="M6,32 C4,14 22,4 45,7 C85,1 145,2 182,9
                  C198,13 197,24 192,32 C198,42 193,51 172,49
                  C122,58 58,56 18,51 C3,48 2,40 6,32 Z"
                fill="#fe5b3a"
              />
            </svg>
            Paid for
          </span>
        </p>
        <p className="text-[1.4rem] leading relaxed">
          Set up your business, share one link, and stop losing chairs to no-shows.
        </p>
        <Link
          href="/onboard"
          className="btn inline-block w-full my-5"
        >
          Set Up your Business
        </Link>
      </div>
    </main>
  )
}

