import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from "../types";

const MODEL_NAME = 'gemini-3-pro-image-preview';

interface ImageInput {
  mimeType: string;
  data: string;
}

/**
 * Generates try-on images using Gemini 3 Pro Image Preview.
 * It uses the Google Search tool if a link is provided to find the clothes context.
 */
export const generateTryOnImages = async (
  userImage: ImageInput,
  clothesLink: string | undefined,
  clothesImages: ImageInput[] // Now an array
): Promise<GeneratedImage[]> => {
  
  // Create a new instance with the selected key (handled by window.aistudio logic in App.tsx)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const results: GeneratedImage[] = [];

  // Helper to run a generation for a specific view
  const runGeneration = async (view: 'Front' | 'Back') => {
    const parts: any[] = [];

    // 1. Add User Image (The Person) - ALWAYS IMAGE 1
    parts.push({
      inlineData: {
        mimeType: userImage.mimeType,
        data: userImage.data,
      },
    });

    // 2. Add Clothes Context (Images or Link)
    let promptText = "";
    
    if (clothesImages && clothesImages.length > 0) {
      // Add all clothing images
      clothesImages.forEach((img) => {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
      });

      const clothesStartIndex = 2;
      const clothesEndIndex = 2 + clothesImages.length - 1;
      const clothesIndices = clothesImages.length === 1 
        ? "2" 
        : `2 through ${clothesEndIndex}`;

      // Construct Prompt based on view
      if (view === 'Front') {
        promptText = `
          ROLE: Expert VFX Compositor and eCommerce Photo Retoucher.

          INPUTS:
          - IMAGE 1: The "TARGET MODEL" (User).
          - IMAGE(S) ${clothesIndices}: The "SOURCE GARMENT" (Clothing Reference).

          OBJECTIVE:
          Perform a photorealistic "Virtual Try-On" by compositing the SOURCE GARMENT onto the TARGET MODEL.
          The goal is COMMERCIAL ACCURACY. The clothes must look EXACTLY like the reference images.

          STRICT EXECUTION GUIDELINES:
          1. **CLOTHING FIDELITY (CRITICAL)**:
             - You MUST preserve the exact cut, shape, and silhouette of the SOURCE GARMENT.
             - You MUST preserve the exact fabric texture, pattern, print, and material glossiness.
             - If the source has a logo, specific buttons, or unique stitching, TRANSFER THEM ACCURATELY. 
             - DO NOT "re-imagine" the clothes. DO NOT generate a generic version. Use the pixels from Image(s) ${clothesIndices} as your truth.

          2. **IDENTITY PRESERVATION**:
             - The face, hair, and skin tone of the TARGET MODEL (Image 1) MUST REMAIN 100% UNCHANGED.
             - The background of Image 1 MUST REMAIN 100% UNCHANGED.

          3. **PHYSICS & LIGHTING**:
             - Warp the SOURCE GARMENT to fit the body of the TARGET MODEL naturally.
             - Match the lighting of the garment to the lighting of the TARGET MODEL's environment.

          NEGATIVE CONSTRAINTS:
          - NO hallucinated patterns.
          - NO changing the sleeve length (if reference is long sleeve, generated must be long sleeve).
          - NO changing the neckline shape.

          OUTPUT:
          A high-resolution, photorealistic Front View of the TARGET MODEL wearing the exact SOURCE GARMENT.
        `;
      } else {
        promptText = `
          ROLE: Expert Technical Fashion Illustrator.

          INPUTS:
          - IMAGE 1: The "TARGET MODEL".
          - IMAGE(S) ${clothesIndices}: The "SOURCE GARMENT".

          TASK:
          Generate a realistic **BACK VIEW** of the TARGET MODEL wearing the SOURCE GARMENT.

          GUIDELINES:
          1. **POSE**: Rotate the TARGET MODEL 180 degrees. Keep the same body shape, height, and hair.
          2. **GARMENT CONSTRUCTION**:
             - Extrapolate the back design based on the SOURCE GARMENT's visible structure.
             - If the front has specific fabric/texture/pattern, the back MUST use the EXACT SAME fabric/texture/pattern.
             - Standard construction rules apply (e.g., zippers usually on back for dresses, seams on sides).
          3. **CONSISTENCY**: The back view must look like it belongs to the same outfit shown in the Front View generation.

          OUTPUT:
          Photorealistic Back View.
        `;
      }
    } else if (clothesLink) {
      // Prompt for Link case - Stricter than before
      if (view === 'Front') {
        promptText = `
          INPUTS:
          - IMAGE 1: The User.
          - CONTEXT: Clothing details from the provided link(s).

          URLS provided:
          ${clothesLink}

          TASK:
          Search the URL(s) to find the specific clothing product images. Then, perform a high-fidelity VIRTUAL TRY-ON on the person in Image 1.

          STRICT RULES:
          1. **FIND THE PRODUCT**: Use the Google Search tool to find the exact product photos (Front, Back, Close-up).
          2. **EXACT REPLICA**: The generated clothing MUST match the real product found at the link in terms of:
             - Color (Exact shade)
             - Pattern/Print (Exact size and placement)
             - Material/Texture (Denim vs Silk vs Cotton etc.)
             - Cut (Neckline, Sleeve length, Hemline)
          3. **NO SUBSTITUTIONS**: Do not replace the item with a "similar" looking item. It must be THE item.
          4. **PRESERVE USER**: Do not change the user's face or background.

          OUTPUT:
          Photorealistic image of the user wearing the SPECIFIC product found at the link.
        `;
      } else {
        promptText = `
          INPUTS:
          - IMAGE 1: The User.
          - CONTEXT: Clothing details from the provided link(s): ${clothesLink}

          TASK: 
          Generate a BACK VIEW of the user wearing the specific clothing item found at the link.
          
          RULES:
          1. Find the back view of the product from the link if possible.
          2. If not found, infer the back view using the fabric and style of the front view found at the link.
          3. Maintain consistency with the user's body and hair.
        `;
      }
    } else {
      throw new Error("No clothes source provided.");
    }

    parts.push({ text: promptText });

    // 3. Configure Tools (Search if link is present)
    const tools = clothesLink && (!clothesImages || clothesImages.length === 0) ? [{ googleSearch: {} }] : [];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        tools: tools,
        imageConfig: {
            aspectRatio: "3:4", 
            imageSize: "2K"
        }
      },
    });

    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${base64EncodeString}`;
          results.push({
            id: `${view}-${Date.now()}`,
            url: imageUrl,
            view: view,
          });
          return; // Found the image, exit loop
        }
      }
    }
    
    // If we reach here without pushing, check for text error
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart) {
        console.warn(`Gemini returned text instead of image for ${view}:`, textPart.text);
    }
  };

  // Run generations
  try {
      await runGeneration('Front');
      await runGeneration('Back');
  } catch (error) {
      console.error("Generation error", error);
      throw error;
  }

  return results;
};
