// Wait! I know what the problem is!
// Look at the screenshot the user provided.
// The laptop screen on the TOP has an image (from `heroCaptureUrl`).
// The laptop screen on the BOTTOM has a fallback `iframe` rendering with `previewUrl`.
// BUT `html-to-image` CANNOT render an iframe!
// When `html-to-image` tries to render an iframe, it either fails or just renders nothing, but wait - the screenshot shows text inside the laptop screen ("Restore Your Roof, Protect Your Home") and a facebook pixel img tag!
// The text in the bottom image is NOT from `heroCaptureUrl` or `previewUrl` (iframe).
// It's from `bespokeHtml`!!
// Where is `bespokeHtml` used?

