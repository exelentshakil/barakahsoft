const fs = require('fs');
const path = './src/app/layout.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldPixelScript = `<Script id="meta-pixel" strategy="afterInteractive">
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

const newPixelScript = `<Script id="meta-pixel" strategy="afterInteractive">
          {\`try {
  var h = window.location.hostname.toLowerCase();
  var p = window.location.pathname;
  if (p.indexOf("/admin") === 0 || p.indexOf("/client-portal") === 0 || p.indexOf("/visual-qa") === 0 || p.indexOf("/api") === 0 || p.indexOf("/auth") === 0 || p.indexOf("/login") === 0) {
    throw new Error('skip_pixel');
  }
  var isLandingHost = h === "redesign.barakahsoft.com" || h === "barakahsoft.com" || h === "www.barakahsoft.com" || h === "home.barakahsoft.com";
  var isLandingPath = p === "/";
  if (!isLandingHost || !isLandingPath) {
    throw new Error('skip_pixel');
  }
} catch(e) { if(e.message === 'skip_pixel') { window.fbq = function(){}; return; } }

!function(f,b,e,v,n,t,s)
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

content = content.replace(oldPixelScript, newPixelScript);

fs.writeFileSync(path, content, 'utf8');
console.log("Restricted pixel to landing page only");
