const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/components/landing/FreeRedesignLanding.tsx');
let code = fs.readFileSync(file, 'utf8');

// Add Image import if missing
if (!code.includes('import Image from "next/image"')) {
  code = code.replace(/import \{.*?\} from "lucide-react";/, `$&
import Image from "next/image";`);
}

// Replace header logo
code = code.replace(
  /<img src="\/icon\.png" alt="BarakahSoft" className="h-9 w-9" \/>/,
  `<Image src="/icon.png" alt="BarakahSoft" width={36} height={36} className="h-9 w-9" />`
);

// Replace EXAMPLES.map desktop images
code = code.replace(
  /<img src={`\/refs\/clients\/\${image}`} alt=\{title\} className="h-full w-full object-cover object-top transition duration-500 hover:scale-105" \/>/g,
  `<Image src={\`/refs/clients/\${image}\`} alt={title} width={316} height={208} className="h-full w-full object-cover object-top transition duration-500 hover:scale-105" />`
);

// Replace EXAMPLES.map mobile images
code = code.replace(
  /<img src={`\/refs\/clients\/\${image}`} alt=\{`\${title} mobile preview`\} className="h-full w-full object-cover object-top" \/>/g,
  `<Image src={\`/refs/clients/\${image}\`} alt={\`\${title} mobile preview\`} width={148} height={320} className="h-full w-full object-cover object-top" />`
);

// Replace People headshots
code = code.replace(
  /<img src=\{image\} alt=\{name\} className="h-20 w-20 rounded-full object-cover object-top" \/>/g,
  `<Image src={image} alt={name} width={80} height={80} className="h-20 w-20 rounded-full object-cover object-top" />`
);

fs.writeFileSync(file, code);
console.log("Updated FreeRedesignLanding.tsx");
