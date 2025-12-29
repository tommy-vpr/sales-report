// lib/domain/import/platform-map.ts
import { Platform } from "@prisma/client";

export const PLATFORM_MAP: Record<string, Platform> = {
  "Meta Ads": Platform.META,
  Meta: Platform.META,
  "X Ads": Platform.X,
  X: Platform.X,
  "TikTok Ads": Platform.TIKTOK,
  TikTok: Platform.TIKTOK,
  "LinkedIn Ads": Platform.LINKEDIN,
  LinkedIn: Platform.LINKEDIN,
  Taboola: Platform.TABOOLA,
  Vibe: Platform.VIBE_CTV,
  "Vibe CTV": Platform.VIBE_CTV,
  "Wholesale Central": Platform.WHOLESALE_CENTRAL,
};
