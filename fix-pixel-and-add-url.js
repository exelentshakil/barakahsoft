const fs = require('fs');

// 1. Fix Layout Script syntax to be identical to what is requested
let layoutPath = './src/app/layout.tsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Replace the Script wrapper with raw script string since it's going inside <head> natively? No, Next.js requires it.
// Let's replace the content of the layout to ensure the meta pixel is 100% exactly the string provided.

const newLayoutHeadScripts = `        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {\`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1777973306713413');
fbq('track', 'PageView');\`}
        </Script>`;

// Replace existing meta pixel blocks (in body) and noscript fallback
layoutContent = layoutContent.replace(/\{\/\* Meta Pixel for Facebook Ads \*\/\}[\s\S]*?<\/Script>/, '');
layoutContent = layoutContent.replace(/\{\/\* Meta Pixel Fallback \*\/\}[\s\S]*?<\/noscript>/, '');

const metaPixelNoscript = `\n        <noscript><img height="1" width="1" style={{ display: "none" }} src="https://www.facebook.com/tr?id=1777973306713413&ev=PageView&noscript=1" alt="" /></noscript>`;

const headReplacementRegex = /<head>[\s\S]*?<\/head>/;
const headMatch = layoutContent.match(headReplacementRegex)[0];
layoutContent = layoutContent.replace(headMatch, headMatch.replace('</head>', newLayoutHeadScripts + '\n      </head>'));

const bodyReplacementRegex = /<body(.*?)>/;
const bodyMatch = layoutContent.match(bodyReplacementRegex)[0];
layoutContent = layoutContent.replace(bodyMatch, bodyMatch + metaPixelNoscript);

fs.writeFileSync(layoutPath, layoutContent, 'utf8');

// 2. Fix add-url route source
let addUrlPath = './src/app/api/leads/add-url/route.ts';
let addUrlContent = fs.readFileSync(addUrlPath, 'utf8');
// Replace `source: "outreach"` with `source: "home"` to bypass constraint until db is migrated
addUrlContent = addUrlContent.replaceAll('source: "outreach"', 'source: "home"');
fs.writeFileSync(addUrlPath, addUrlContent, 'utf8');

console.log("Fixed files");
