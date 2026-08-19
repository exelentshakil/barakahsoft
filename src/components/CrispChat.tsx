import Script from "next/script";

const CRISP_WEBSITE_ID = "28d857ed-70f3-4edf-bba4-e23a1e627d00";

/** Shared support chat for BarakahSoft-owned surfaces only. */
export function CrispChat() {
  return (
    <Script id="crisp-chat" strategy="afterInteractive">
      {`window.$crisp=[];window.CRISP_WEBSITE_ID="${CRISP_WEBSITE_ID}";document.addEventListener("click",function(e){var t=e.target.closest("button,a");var l=t&&t.textContent.trim();if(l&&/Message team|Request a change|Ask a question|Send to team|Open message|Message BarakahSoft/.test(l)){window.$crisp.push(["do","chat:open"]);}});(function(){var d=document,s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}
    </Script>
  );
}
