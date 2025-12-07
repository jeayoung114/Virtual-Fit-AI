# Virtual Fit AI 👕✨

**Virtual Fit AI** is a cutting-edge web application that allows users to virtually "try on" clothes using the power of Google's Gemini 3 Pro model. Simply upload a photo of yourself and a photo (or link) of a clothing item, and the AI will generate a photorealistic visualization of how it looks on you—preserving your identity while accurately mapping the fabric textures and cuts.

![App Screenshot](./screenshot.png)
*(Note: Capture a screenshot of the app and save it as `screenshot.png` in the root directory)*

## Features

-   **📸 Virtual Try-On**: Upload a full-body photo and see yourself in new outfits instantly.
-   **🔗 Multi-Source Clothing**: Upload multiple reference images (Front, Back, Texture) or paste product URLs to give the AI complete context.
-   **👤 Identity Preservation**: Advanced prompt engineering ensures your face and body shape remain unchanged.
-   **🧵 High Fidelity Texture**: The "Expert VFX Compositor" mode ensures fabric patterns, logos, and materials are transferred accurately.
-   **🔄 Dual Views**: Generates both Front and Back views of the outfit.
-   **⚡ Gemini 3 Pro**: Powered by Google's latest multimodal model (`gemini-3-pro-image-preview`) for superior image generation and editing.

## Tech Stack

-   **Frontend**: React 19, TypeScript
-   **Styling**: Tailwind CSS
-   **AI**: Google Gemini API (`@google/genai` SDK)
-   **Icons**: Lucide React

## Setup & Usage

1.  **API Key**: Upon launch, you will be prompted to select a paid API key. This is required to access the high-quality Gemini 3 Pro model and Google Search Grounding features.
2.  **Upload User Photo**: Upload a clear, full-body photo of yourself with good lighting.
3.  **Provide Clothing**:
    -   **Option A (Images)**: Upload one or more images of the clothing item (e.g., front view, back view, fabric close-up).
    -   **Option B (Link)**: Paste URL(s) to the product page.
4.  **Try On**: Click "Try On Now". The AI will process the inputs and generate a Front and Back view.
5.  **Download**: Click the download icon on the result cards to save your new look.

## License

MIT
