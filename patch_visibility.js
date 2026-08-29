const fs = require('fs');
let code = fs.readFileSync('src/components/admin/VisibilityPanel.tsx', 'utf8');

code = code.replace(/\/\/ The measurement is dozens[\s\S]*?\}, \[running, load\]\);\n/, '');

// Now to add a refresh button when running
// Wait, is there a button?
// Let's check how it's rendered when running.
fs.writeFileSync('src/components/admin/VisibilityPanel.tsx', code);
