/**
 * Utility to download a remote image using fetch.
 * This converts the image to a blob and triggers a browser download.
 */
export async function downloadImage(url, filename = "ai-headshot-portrait.jpg") {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Download failed:", error);
    window.open(url, "_blank");
  }
}

/**
 * Generate a unique color for each style name to use as placeholder
 */
function getColorForName(name) {
  const colors = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e", "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#06b6d4", "#3b82f6", "#64748b", "#84cc16",
    "#0ea5e9", "#8b5cf6", "#d946ef", "#f59e0b", "#10b981",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * SVG placeholder for the carousel - generates a colored card with initials
 */
export function generatePlaceholderSVG(name) {
  const bgColor = getColorForName(name);
  const initials = name.slice(0, 2).toUpperCase();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <rect width="400" height="500" fill="${bgColor}" rx="12"/>
      <circle cx="200" cy="180" r="80" fill="rgba(255,255,255,0.2)"/>
      <text x="200" y="195" text-anchor="middle" fill="white" font-size="60" font-weight="bold" font-family="sans-serif">${initials}</text>
      <text x="200" y="360" text-anchor="middle" fill="white" font-size="28" font-weight="bold" font-family="sans-serif" opacity="0.9">${name}</text>
      <text x="200" y="390" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif" opacity="0.6">AI Portrait</text>
      <rect x="120" y="430" width="160" height="30" rx="15" fill="rgba(255,255,255,0.15)"/>
      <text x="200" y="450" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif" opacity="0.7">✦ AI Generated</text>
    </svg>`
  )}`;
}

export const headshotsExamples = [
  { name: "LinkedIn" },
  { name: "Cyberpunk" },
  { name: "Anime" },
  { name: "CEO" },
  { name: "Tinder" },
  { name: "Doctor" },
  { name: "OldMoney" },
  { name: "Lawyer" },
  { name: "Fitness" },
  { name: "Ghibli" },
  { name: "Bali" },
  { name: "Pixar" },
  { name: "Halloween" },
  { name: "Christmas" },
  { name: "Travel" },
  { name: "Superhero" },
];
