import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-white">M</span>
          Messe India <span className="font-normal text-stone-500">Booth Planner</span>
        </div>
        <Link href="/planner" className="text-sm font-medium text-stone-600 hover:text-stone-900">
          Open planner →
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 pb-16 md:grid-cols-2">
        <div>
          <p className="mb-4 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Shell scheme · Corner · Island booths
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Design your exhibition booth in minutes
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-stone-600">
            Pick your booth size, place counters, seating and screens on a floor plan, and walk
            around the result in 3D before anything gets built.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/planner"
              className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
            >
              Start designing
            </Link>
            <span className="text-sm text-stone-500">No sign-up. Saved in your browser.</span>
          </div>
        </div>

        <FloorPlanIllustration />
      </section>
    </main>
  );
}

function FloorPlanIllustration() {
  const grid = Array.from({ length: 13 }, (_, i) => i * 30);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <svg viewBox="0 0 360 240" className="h-auto w-full" aria-hidden>
        {grid.map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={240} stroke="#f0efed" />
        ))}
        {grid.slice(0, 9).map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={360} y2={y} stroke="#f0efed" />
        ))}
        <rect x={30} y={30} width={300} height={180} fill="#fafaf9" />
        <path d="M30 210 V30 H330" fill="none" stroke="#44403c" strokeWidth={3} />
        <path d="M30 210 H330 V30" fill="none" stroke="#a8a29e" strokeWidth={2} strokeDasharray="6 5" />
        <rect x={45} y={40} width={70} height={60} rx={2} fill="#e7e5e4" stroke="#78716c" />
        <rect x={140} y={38} width={90} height={22} rx={2} fill="#fde9d6" stroke="#c2763a" />
        <rect x={160} y={140} width={80} height={30} rx={2} fill="#dbeafe" stroke="#2563eb" strokeWidth={2} />
        <rect x={60} y={130} width={60} height={34} rx={2} fill="#fde9d6" stroke="#c2763a" />
        {[70, 100].map((x) => (
          <rect key={x} x={x} y={118} width={14} height={10} rx={2} fill="#fecaca" stroke="#dc2626" />
        ))}
        <circle cx={300} cy={180} r={12} fill="#d1fae5" stroke="#059669" />
        <text x={180} y={228} textAnchor="middle" fontSize={11} fill="#78716c">
          6.0 m
        </text>
      </svg>
    </div>
  );
}
