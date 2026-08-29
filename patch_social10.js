const fs = require("fs");
const path = "./src/components/mockup/SocialLaunchMockup.tsx";
let code = fs.readFileSync(path, "utf8");

// The problem is that transparentStageRef is NOT wrapped around the Campaign Angle text for the feed / story / landscape containers!
// The transparentStageRef is ONLY in the main view (around lines 942-995).
// In the export function, `if (format === "transparent") { targetEl = transparentStageRef.current; }`
// And `transparentStageRef.current` is just the node in the live preview.
// BUT `targetEl = feedRef.current || mockupRef.current` for feed export.
// So `transparent PNG` exports whatever is in `transparentStageRef`.
// Oh! The user said: "export buttons are not exporting exactly how it is lookin gon preview for both : 3D Stage Composition (Rock Pedestal Showcase vs Studio 3D Poster) and Campaign Angle (NEW WEBSITE vs REDESIGN)"

// Wait, the user is saying that changing those toggles doesn't update the export!
// If I look at the screenshot, it shows "REDESIGN CONCEPT", but the laptop screen has "SADDLE ROOFING" with a white background, while the actual website in the rock pedestal in the second image shows "Restore Your Roof" with a white background and a different layout...
// No, the screenshot shows the LIVE PREVIEW at the top (which has "REDESIGN CONCEPT" text in red, and the laptop showing an image of two guys near a van), and the EXPORTED IMAGE at the bottom (which is a laptop floating with no pedestal, "Restore Your Roof" in the screen, and no background/angle text!).
// Oh wait.
// The top half of the screenshot IS the Live Preview.
// The bottom half is the EXPORTED image.
// Why did the export render "Studio 3D Poster" (floating laptop) instead of the "Rugged Mountain Slate Pedestal", AND why did the exported image have an iframe/html fallback instead of the `heroCaptureUrl` (the image of the van)?

