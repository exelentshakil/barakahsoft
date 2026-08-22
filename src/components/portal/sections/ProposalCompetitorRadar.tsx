import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CompetitorBar {
  name: string;
  speed: number;
  pages: number;
}

interface RadarItem {
  subject: string;
  Client: number;
  Competitors: number;
  fullMark: number;
}

interface ProposalCompetitorRadarProps {
  businessName: string;
  competitorBars: CompetitorBar[];
  radarData: RadarItem[];
}

export function ProposalCompetitorRadar({
  businessName,
  competitorBars,
  radarData,
}: ProposalCompetitorRadarProps) {
  return (
    <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
            Market Competitor Benchmark
          </span>
          <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
            {businessName} vs. Top Local Competitors
          </h2>
          <p className="text-sm text-[#42506a]">
            How the rebuilt platform puts you ahead in mobile speed, conversion UX, and service route depth.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={competitorBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7f2" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#777588", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#777588", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7f2", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="speed" name="Speed Score (100)" fill="#533afd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pages" name="Service Routes" fill="#0b8f5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#e5e7f2" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#777588", fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name={`${businessName} (Rebuilt)`} dataKey="Client" stroke="#533afd" fill="#533afd" fillOpacity={0.4} />
              <Radar name="Competitor Avg" dataKey="Competitors" stroke="#777588" fill="#777588" fillOpacity={0.15} />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e7f2", borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
