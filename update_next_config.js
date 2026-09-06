const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'next.config.mjs');
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('remotePatterns')) {
  code = code.replace(/eslint: \{ ignoreDuringBuilds: true \},/, `eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'barakahsoft.com',
      },
    ],
  },`);
  fs.writeFileSync(file, code);
  console.log("Updated next.config.mjs");
} else {
  console.log("Already has remote patterns");
}
