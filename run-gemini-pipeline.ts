import { config } from "dotenv";
config({ path: ".env.local" });
import { extractDesignDna } from "./src/lib/design-dna";
import { generateBespokePage } from "./src/lib/generate-bespoke-site";
import { callGemini } from "./src/lib/gemini-client";
import { MASTER_HERO_STANDARD, MASTER_ABOUT_STANDARD, HYGIENE_STANDARD, STANCE, COLOUR_STANDARD, TYPE_STANDARD, SPACE_STANDARD } from "./src/lib/generate/standard";

// Mock the brief we extracted from the user's input
const brief = {
  businessName: "Saddle Roofing",
  industry: "Roofing contractor",
  city: "Cheyenne, WY",
  founder: "Tony and Hannah Ostheimer",
  phone: "(307) 475-6088",
  email: "info@saddleroofing.com",
  aboutContent: "Welcome to Saddle Roofing, a Wyoming family-owned and operated roofing company founded by Tony and Hannah Ostheimer. A Civil and Environmental Engineer, Tony has over a decade of experience in the roofing and construction industry. Together, the Saddle Roofing team brings a wealth of knowledge, expertise, and organization to every project we undertake. Our journey began with a simple yet powerful vision - to provide high-quality roofing services at fair prices, all while supporting our local communities. Through his previous work for other roofing companies, Tony witnessed customers' frustration with seeing money flow out of state to non-resident roofing corporations. This frustration is what inspired Tony and Hannah to create a company that prioritizes local talent and resources.",
  services: ["Roof Inspection", "Roof Repair", "Roof Replacement", "Gutter Services", "Skylight Services", "Shingle Roofs", "Metal Roofs", "Emergency Roof Repair"],
  areas: ["Cheyenne", "Lander", "Gillette", "Casper", "Stuart", "Rock Springs", "Sheridan", "Laramie"],
  rating: 4.9,
  reviewCount: 299,
  reviews: [],
  photos: [],
  heroImage: "https://img1.wsimg.com/isteam/ip/ac892ea6-4c1c-444a-8a56-c0458ee66663/IMG_20240409_124547.jpg/:/cr=t:16.67%25,l:0%25,w:100%25,h:66.67%25/rs=w:600,h:300,cg:true",
  logoUrl: "https://img1.wsimg.com/isteam/ip/ac892ea6-4c1c-444a-8a56-c0458ee66663/Saddle%20Roofing%20Logo%20-%20White%20PNG.png/:/rs=h:100,cg:true,m/qt=q:95",
  factsDigest: "Licensed, bonded, and insured. Manufacturer-certified. 10-year workmanship warranty.",
  licensedInsured: true,
  leadSlug: "saddle-roofing",
  painInstructions: ["Outdated design / looks wrong on phones", "Not enough leads or enquiries", "Nobody finds us on Google", "Invisible in AI search", "Visitors don't convert into calls"]
};

const dna = {
  mood: "warm-craft",
  palette: {
    ink: "#2C393F",
    accent: "#A42F4E",
    primary: "#F37A1F",
    surface: "#FFFFFF",
    inkMuted: "#6B7A84",
    onPrimary: "#FFFFFF",
    surfaceAlt: "#F5F5F5"
  },
  typography: {
    scale: "balanced",
    bodyFamily: "Open Sans",
    headingCase: "upper",
    displayFamily: "Kumbh Sans",
    displayWeight: "800"
  },
  geometry: {
    radius: "soft",
    elevation: "dramatic",
    borderTreatment: "none"
  }
};

async function run() {
  console.log("Generating WOOOOOW Website...");
  
  const prompt = `
  You are an elite conversion rate optimizer and frontend developer building a high-ticket agency website.
  Generate the FULL HTML (with inline Tailwind CSS) for the Hero and About sections of this website in ONE shot.
  
  BUSINESS: ${brief.businessName} in ${brief.city}
  PHONE: ${brief.phone}
  PROBLEMS TO SOLVE: ${brief.painInstructions.join(", ")}
  
  DESIGN TOKENS TO USE AS TAILWIND ARBITRARY VALUES:
  - Primary (Buttons/Gradients): ${dna.palette.primary}
  - Accent (Eyebrows/Badges): ${dna.palette.accent}
  - Ink (Dark Text/Backgrounds): ${dna.palette.ink}
  - Surface: ${dna.palette.surface}
  
  ${MASTER_HERO_STANDARD}
  
  ${MASTER_ABOUT_STANDARD}
  
  Return ONLY valid HTML inside a \`\`\`html block. Include a dark header with the logo and contact info.
  `;
  
  try {
    const html = await callGemini(prompt, "gemini-3.1-pro-preview");
    const fs = require('fs');
    fs.writeFileSync('./public/showcase-preview.html', html);
    console.log("Website generated and saved to ./public/showcase-preview.html!");
  } catch(e) {
    console.error("Failed", e);
  }
}
run();
