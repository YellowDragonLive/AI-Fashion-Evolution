import { GoogleGenAI } from '@google/genai';

export type ImageSize = '1K' | '2K' | '4K';

export interface GenerationResult {
  base64: string;
  mimeType: string;
}

export async function generateFashionImage(
  prompt: string,
  referenceImageBase64: string | null,
  referenceImageMimeType: string | null,
  imageSize: ImageSize = '1K'
): Promise<GenerationResult> {
  // Create a new instance right before the API call to get the latest key
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API key is missing.');
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [{ text: prompt }];

  if (referenceImageBase64 && referenceImageMimeType) {
    parts.unshift({
      inlineData: {
        data: referenceImageBase64,
        mimeType: referenceImageMimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts,
    },
    config: {
      imageConfig: {
        aspectRatio: '9:16',
        imageSize: imageSize,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }

  throw new Error('No image generated in the response.');
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
