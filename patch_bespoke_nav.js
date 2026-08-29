const fs = require('fs');

let content = fs.readFileSync('src/components/site-shell/BespokeNav.tsx', 'utf8');

// Update imports
content = content.replace(
  'import { ArrowRight, ChevronDown, MapPin, Menu, Phone, Sparkles, X, ShieldCheck, Star } from "lucide-react";',
  'import { ArrowRight, ChevronDown, MapPin, Menu, Phone, Sparkles, X, ShieldCheck, Star, Wrench, Zap, Home, Droplets, PenTool, Activity, Sun, Wind, Thermometer, Leaf, Settings, Shield, PlusCircle, CheckCircle, Navigation } from "lucide-react";\n\nconst SERVICE_ICONS = [ShieldCheck, Wrench, Zap, Home, Droplets, PenTool, Activity, Sun, Wind, Thermometer, Leaf, Settings, Shield, PlusCircle, CheckCircle, Navigation];'
);

// Update cardImage logic
const newCardImageLogic = `
    const allImages = [
      payload.heroImageUrl,
      ...(payload.services?.map(s => s.imageUrl) || []),
      ...(payload.services?.flatMap(s => s.imageUrls || []) || []),
      ...(payload.areas?.map(a => a.imageUrl) || []),
      ...(payload.areas?.flatMap(a => a.imageUrls || []) || []),
      payload.proof?.imageUrl,
      payload.trustStrip?.imageUrl,
      ...(payload.trustStrip?.imageUrls || []),
      payload.expertise?.imageUrl,
      ...(payload.expertise?.imageUrls || []),
      payload.process?.imageUrl,
      ...(payload.process?.imageUrls || []),
      payload.ctaBanner?.imageUrl,
      ...(payload.ctaBanner?.imageUrls || []),
    ].filter(Boolean) as string[];

    const cardImage = allImages.length > 0 
      ? (kind === "services" ? allImages[0] : (allImages.length > 1 ? allImages[1] : allImages[0])) 
      : null;
`;

content = content.replace(
  /\/\/ Dynamic image assignment based on menu type[\s\S]*?(?=\s*return \()/m,
  newCardImageLogic
);

// Update map
content = content.replace(
  /\{items\.map\(\(item\) => \{/,
  '{items.map((item, idx) => {'
);

// Update service icon
content = content.replace(
  /<ShieldCheck className="h-5 w-5" \/>/g,
  `{(() => {\n                            const Icon = SERVICE_ICONS[idx % SERVICE_ICONS.length];\n                            return <Icon className="h-5 w-5" />;\n                          })()}`
);

fs.writeFileSync('src/components/site-shell/BespokeNav.tsx', content, 'utf8');
