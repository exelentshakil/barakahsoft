"use client";

export function StripeDashboardTheme() {
  return <style jsx global>{`
    [data-prototype-dashboard] {
      --prototype-purple: #ffd12d;
      --prototype-ink: #07284d;
      --prototype-pink: #fff8d9;
      font-family: "Sohne", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif;
    }
    [data-prototype-dashboard] [class*="bg-[#ffd12d]"] { background-color: var(--prototype-purple) !important; }
    [data-prototype-dashboard] [class*="hover:bg-[#f5c400]"]:hover { background-color: #f5c400 !important; }
    [data-prototype-dashboard] [class*="text-[#111]"] { color: #07284d !important; }
    [data-prototype-dashboard] [class*="text-[#ffd12d]"],
    [data-prototype-dashboard] [class*="text-[#8c6800]"] { color: #0c68c8 !important; }
    [data-prototype-dashboard] [class*="text-[#07284d]"] { color: var(--prototype-ink) !important; }
    [data-prototype-dashboard] [class*="text-[#0c68c8]"] { color: #0c68c8 !important; }
    [data-prototype-dashboard] [class*="bg-[#07284d]"] { background-color: var(--prototype-ink) !important; }
    [data-prototype-dashboard] aside { background-color: #fff !important; color: var(--prototype-ink) !important; border-right: 1px solid #e5e2ff; }
    [data-prototype-dashboard] aside [class*="text-white"] { color: var(--prototype-ink) !important; }
    [data-prototype-dashboard] aside [class*="bg-white/10"] { background-color: #fff8d9 !important; }
    [data-prototype-dashboard] [class*="bg-[#eef7ff]"],
    [data-prototype-dashboard] [class*="bg-[#f8fbfe]"],
    [data-prototype-dashboard] [class*="bg-[#f5f9fc]"] { background-color: #fafaff !important; }
    [data-prototype-dashboard] [class*="border-[#d9e8f4]"],
    [data-prototype-dashboard] [class*="border-[#c8ddec]"] { border-color: #e5e2ff !important; }
    [data-prototype-dashboard] .rounded-3xl,
    [data-prototype-dashboard] .rounded-2xl { border-radius: 10px !important; }
    [data-prototype-dashboard] .rounded-xl { border-radius: 7px !important; }
    [data-prototype-dashboard] .rounded-lg { border-radius: 4px !important; }
    [data-prototype-dashboard] aside nav button,
    [data-prototype-dashboard] aside nav a { color: #42506a !important; }
    [data-prototype-dashboard] aside nav button:hover,
    [data-prototype-dashboard] aside nav a:hover { background-color: #fafaff !important; color: #0c68c8 !important; }
    [data-prototype-dashboard] aside nav button[class*="bg-white/10"] { background-color: #fff8d9 !important; color: #0c68c8 !important; }
  `}</style>;
}
