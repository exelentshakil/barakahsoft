const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/components/landing/LandingTeamShowcase.tsx');
let code = fs.readFileSync(file, 'utf8');

// Add Image import if missing
if (!code.includes('import Image from "next/image"')) {
  code = code.replace(/import \{.*?\} from "lucide-react";/, `$&
import Image from "next/image";`);
}

// Replace People headshots
code = code.replace(
  /<img src=\{person\.image\} alt=\{person\.name\} className="absolute inset-0 h-full w-full object-cover object-top grayscale-\[15%\] transition duration-500 group-hover:scale-105" \/>/g,
  `<Image src={person.image} alt={person.name} width={190} height={270} className="absolute inset-0 h-full w-full object-cover object-top grayscale-[15%] transition duration-500 group-hover:scale-105" />`
);

fs.writeFileSync(file, code);
console.log("Updated LandingTeamShowcase.tsx");
