import { Briefcase, Building, HeartPulse, Home, Scale, Store } from "lucide-react";

const INDUSTRIES = [
  { icon: Home, label: "Home Services", orbit: "orbit-1", delay: "0s", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: Store, label: "Franchise", orbit: "orbit-2", delay: "-4s", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: Scale, label: "Legal & Finance", orbit: "orbit-3", delay: "-2s", color: "text-indigo-500", bg: "bg-indigo-50" },
  { icon: HeartPulse, label: "Healthcare", orbit: "orbit-2", delay: "-9s", color: "text-rose-500", bg: "bg-rose-50" },
  { icon: Building, label: "Business to Business", orbit: "orbit-4", delay: "-6s", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Briefcase, label: "Small Business", orbit: "orbit-3", delay: "-12s", color: "text-cyan-500", bg: "bg-cyan-50" },
];

export function LandingIndustries() {
  return (
    <>
      <style suppressHydrationWarning>{
        `
        @keyframes spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        `
      }</style>
      <section className="relative overflow-hidden border-t border-[#d9e8f4] bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 relative z-10">
        <div className="text-center mb-16">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Global Coverage</p>
          <h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">
            Industries We Serve
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#60778d]">
            We deploy bespoke AI-driven websites and conversion systems across every major vertical, 
            tailoring the strategy, design, and structure to your specific industry.
          </p>
        </div>
        
        <div className="relative mx-auto h-[500px] max-w-[800px] overflow-hidden sm:h-[650px]">
          {/* Sun / Core */}
          <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-none z-20 overflow-hidden border border-[#e2e8f0]">
            <img src="https://redesign.barakahsoft.com/icon.png" alt="BarakahSoft" className="h-16 w-16 object-contain" />
          </div>

          {/* Orbit Rings */}
          <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e2e8f0]" />
          <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e2e8f0] opacity-70" />
          <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e2e8f0] opacity-40 hidden sm:block" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e2e8f0] opacity-20 hidden sm:block" />

          {/* Orbits */}
          <div className="absolute inset-0">
            {INDUSTRIES.map((ind) => {
              // Radiuses match the rings: 100px, 160px, 230px, 300px
              const radius = ind.orbit === 'orbit-1' ? 100 : ind.orbit === 'orbit-2' ? 160 : ind.orbit === 'orbit-3' ? 230 : 300;
              const duration = ind.orbit === 'orbit-1' ? '15s' : ind.orbit === 'orbit-2' ? '25s' : ind.orbit === 'orbit-3' ? '35s' : '45s';
              
              return (
                <div 
                  key={ind.label} 
                  className="absolute left-1/2 top-1/2 flex h-0 w-0 items-center justify-center"
                  style={{ 
                    animation: `spin ${duration} linear infinite`,
                    animationDelay: ind.delay 
                  }}
                >
                  <div style={{ transform: `translateX(${radius}px)` }}>
                    <div 
                      className="flex h-[80px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-full border border-white bg-white/90 shadow-md backdrop-blur-sm"
                      style={{ 
                        animation: `spin-reverse ${duration} linear infinite`,
                        animationDelay: ind.delay 
                      }}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${ind.bg} ${ind.color}`}>
                        <ind.icon className="h-4 w-4 animate-[spin_12s_linear_infinite]" />
                      </div>
                      <span className="text-center text-[9px] font-bold leading-tight text-[#07284d] px-2">{ind.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
