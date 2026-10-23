const MESSAGE = [
  "⚠️ ZENTRAL HACK SUSPENDED: Power outage due to severe weather.",
  "We will resume tomorrow Saturday at 08:00 with breakfast.",
  "If possible, please go home.",
  "If you can't get home, please go down immediately to the reception."
].join("  •  ")

export default function AlertBanner() {
  return (
    <>
      {/* Keyframes inline so no Tailwind config change is needed */}
      <style>{`
        @keyframes alert-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      <div
        role="alert"
        className="fixed inset-x-0 top-0 z-[9999] overflow-hidden bg-red-700 py-3 text-lg font-bold text-white shadow-lg">
        <div className="flex w-max animate-[alert-marquee_30s_linear_infinite] motion-reduce:w-auto motion-reduce:animate-none">
          <span className="pr-16 whitespace-pre motion-reduce:px-4 motion-reduce:whitespace-normal">
            {MESSAGE}
          </span>
          {/* Duplicate for a seamless loop; hidden for screen readers and reduced motion */}
          <span aria-hidden="true" className="pr-16 whitespace-pre motion-reduce:hidden">
            {MESSAGE}
          </span>
        </div>
      </div>

      {/* Spacer so page content isn't hidden behind the fixed banner */}
      <div aria-hidden="true" className="h-12" />
    </>
  )
}
