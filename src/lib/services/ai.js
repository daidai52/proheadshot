import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

/**
 * Style-specific prompts for headshot generation
 * Each category maps to a prompt that guides the AI transformation
 */
const STYLE_PROMPTS = {
  "LinkedIn": "Professional corporate headshot, business attire, clean neutral background, studio lighting, high quality portrait photography",
  "Tinder": "Casual dating profile photo, warm natural lighting, genuine smile, relaxed atmosphere",
  "Bumble": "Approachable dating profile photo, soft natural lighting, casual outfit, warm background",
  "OldMoney": "Classic old money aesthetic, timeless elegant style, sophisticated, neutral tones, refined portrait",
  "Cyberpunk": "Cyberpunk style portrait, neon lights, futuristic city background, vibrant purple and blue tones, high tech",
  "CEO": "Powerful CEO portrait, dark suit, executive office background, confident pose, dramatic lighting, authoritative",
  "CleanGirl": "Clean girl aesthetic, minimal makeup, natural look, soft lighting, dewy skin, elegant simplicity",
  "DarkAcademia": "Dark academia style, vintage library aesthetic, warm brown tones, scholarly, tweed jacket, classic",
  "Anime": "Anime style portrait, cel-shaded, vibrant colors, Japanese animation style, clean line art",
  "Doctor": "Medical professional portrait, white coat, hospital background, trustworthy expression, professional",
  "Lawyer": "Professional lawyer portrait, suit and tie, law office background, confident, authoritative",
  "MobWife": "Mob wife aesthetic, glamorous, fur coat, dramatic makeup, luxury jewelry, bold confidence",
  "Bali": "Beach portrait, Bali tropical background, natural sunlight, vacation vibes, palm trees, relaxed",
  "90s": "90s aesthetic portrait, vintage film look, grunge or classic 90s style, retro vibes",
  "Fitness": "Fitness portrait, athletic wear, gym background, muscular, determined expression, sporty lighting",
  "Christmas": "Christmas themed portrait, festive background, warm holiday lighting, cozy sweater or formal",
  "Halloween": "Halloween themed portrait, spooky or creative costume, dramatic lighting, festive atmosphere",
  "EuropeanElegance": "European elegance portrait, sophisticated, Parisian or Italian style, classic fashion backdrop",
  "ChampionSportsMoment": "Sports champion portrait, celebrating victory, dynamic pose, stadium background, energetic",
  "JobSwapDaydream": "Creative job swap fantasy portrait, whimsical, imaginative career transformation scene",
  "TravelTheWorld": "Travel portrait, iconic world landmark background, adventurous, explorer style",
  "DatingPack": "Dating profile variety pack, multiple looks, casual to formal, approachable and genuine",
  "FlashPosePerfection": "Flash photography portrait, candid moment, urban setting, night vibe, cool aesthetic",
  "CapAndGown": "Graduation portrait, cap and gown, diploma, university background, proud moment",
  "CorporateBoss": "Corporate executive portrait, modern office setting, power suit, boardroom background",
  "RocknRollLuxury": "Rock and roll luxury portrait, edgy style, leather jacket, musical instruments, bold attitude",
  "TheBigWeddingDay": "Wedding portrait, bride or groom, elegant attire, romantic background, celebration",
  "RusticCharm": "Rustic charm portrait, countryside setting, natural earthy tones, cozy farmhouse aesthetic",
  "DressedToImpress": "Red carpet portrait, formal evening wear, glamorous lighting, paparazzi style",
  "IdentificationPhoto": "Professional ID photo, plain white background, neutral expression, passport standard",
  "DontMissYourProm": "Prom night portrait, formal dance attire, corsage or boutonniere, elegant venue background",
  "GoddessOfNature": "Nature goddess portrait, floral crown, ethereal forest background, mystical lighting",
  "BlackAndWhiteMagic": "Black and white artistic portrait, dramatic contrast, timeless photography style",
  "HomelyComforts": "Cozy home portrait, comfortable setting, warm indoor lighting, casual authentic vibe",
  "BalloonsBalloonsBalloons": "Celebration portrait, colorful balloons, festive background, joyful expression, party",
  "BeautyBlooms": "Beauty portrait with flowers, blooming garden background, soft feminine lighting, elegant",
  "SuperheroAdventure": "Superhero fantasy portrait, action pose, comic book style, dramatic cape, heroic",
  "BoldFashionStatements": "High fashion editorial portrait, avant-garde outfit, runway style, dramatic makeup",
  "FantasyOutfits": "Fantasy character portrait, medieval or magical costume, enchanted forest background",
  "OnTheCatwalk": "Catwalk fashion portrait, runway walk, designer outfit, fashion show lighting",
  "HalloweenHorror": "Horror themed portrait, creepy atmosphere, dark tones, special effects makeup",
  "CosplayGalore": "Cosplay character portrait, detailed costume, convention setting, anime or game character",
  "Ghibli": "Studio Ghibli anime style, soft watercolor aesthetic, whimsical background, Miyazaki inspired",
  "Pixar": "Pixar 3D animation style, rendered character, colorful, stylized, family friendly",
  "SpiderVerse": "Spider-Verse comic style, cel-shaded, half-tone dots, vibrant pop art, dynamic pose",
};

/**
 * Default prompt fallback for categories not in the map
 */
function getPromptForCategory(category) {
  return STYLE_PROMPTS[category] || `Professional ${category} style portrait, high quality, studio lighting`;
}

/**
 * Service to manage AI Headshot Studio generations using SiliconFlow
 */
export const AIService = {
  getCreditCost() {
    return 60;
  },

  /**
   * Generate a headshot using SiliconFlow's image-to-image API
   * Returns immediately with the image URL (synchronous generation)
   */
  async generate(userId, { image_url, category, aspect_ratio = "1:1" }, customApiKey = null) {
    const isUsingCustomKey = Boolean(customApiKey && customApiKey.trim().length > 0);
    const cost = isUsingCustomKey ? 0 : this.getCreditCost();

    if (!isUsingCustomKey && cost > 0) {
      await UserService.deductCredits(userId, cost);
    }

    const apiKey = isUsingCustomKey ? customApiKey.trim() : config.ai.headshot.apiKey;
    if (!apiKey) throw new Error("API Key is not configured");

    const prompt = getPromptForCategory(category);

    const aspectSize = this.getAspectSize(aspect_ratio);

    const requestBody = {
      model: config.ai.headshot.model,
      prompt: prompt,
      image: image_url,
      n: 1,
      size: aspectSize,
    };

    const submitRes = await fetch(config.ai.headshot.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      let errorMsg;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error?.message) {
          errorMsg = errJson.error.message;
        } else if (errJson.error) {
          errorMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
        } else {
          errorMsg = errorText;
        }
      } catch {
        errorMsg = errorText || `API returned status ${submitRes.status}`;
      }
      throw new Error(errorMsg);
    }

    const result = await submitRes.json();
    const outputs = result.images || [];
    const imageUrls = outputs.map(img => img.url).filter(Boolean);

    if (imageUrls.length === 0) {
      throw new Error("No images generated. AI provider returned empty result.");
    }

    // Store the generation in the database
    const creationModel = prisma.creation || prisma.Creation;
    if (creationModel) {
      await creationModel.create({
        data: {
          userId,
          category,
          aspectRatio: aspect_ratio,
          imageUrl: JSON.stringify(imageUrls),
          status: "completed",
          isPack: imageUrls.length > 1,
        }
      });
    }

    // Return the result immediately (synchronous API)
    return {
      request_id: Date.now().toString(),
      status: "completed",
      imageUrl: imageUrls,
    };
  },

  /**
   * Map aspect ratio to SiliconFlow size format
   */
  getAspectSize(aspectRatio) {
    const sizes = {
      "1:1": "1024x1024",
      "4:3": "1152x896",
      "3:4": "896x1152",
      "16:9": "1280x768",
      "9:16": "768x1280",
    };
    return sizes[aspectRatio] || "1024x1024";
  },

  /**
   * Check status - for SiliconFlow, generation is synchronous so this is a simple lookup
   */
  async checkStatus(requestId, userId, metadata, customApiKey = null) {
    const creationModel = prisma.creation || prisma.Creation;
    if (!creationModel) return { status: "processing" };

    const creation = await creationModel.findUnique({
      where: { requestId }
    });

    if (!creation) {
      return { status: "processing" };
    }

    if (creation.status === "completed") {
      try {
        const urlData = JSON.parse(creation.imageUrl || "[]");
        return { status: "completed", imageUrl: urlData };
      } catch (e) {
        return { status: "completed", imageUrl: creation.imageUrl };
      }
    }

    if (creation.status === "failed") {
      throw new Error(creation.error || "Generation failed.");
    }

    return { status: "processing" };
  }
};

export { STYLE_PROMPTS };
