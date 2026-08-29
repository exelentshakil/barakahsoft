const fs = require('fs');
let code = fs.readFileSync('src/components/admin/VisibilityPanel.tsx', 'utf8');

const runningHtml = `        {running && (
          <div className="flex items-center gap-2 rounded-md border border-[#533afd]/20 bg-[#f9f9ff] p-3 text-xs text-[#0d1738]">
            <Loader2 className="h-4 w-4 animate-spin text-[#533afd]" />
            Searching each area. This takes a few minutes — you can leave this page.
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={load}
              className="ml-auto h-7 px-2 text-[10px] uppercase tracking-wider bg-white"
            >
              Refresh Status
            </Button>
          </div>
        )}`;

code = code.replace(/\{running && \([\s\S]*?This takes a few minutes — you can leave this page\.[\s\S]*?<\/div>[\s\S]*?\)\}/, runningHtml);
fs.writeFileSync('src/components/admin/VisibilityPanel.tsx', code);
