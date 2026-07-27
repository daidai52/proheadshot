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
