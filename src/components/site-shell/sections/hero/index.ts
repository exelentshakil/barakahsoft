import { HeroSplitImage } from "@/components/site-shell/sections/hero/HeroSplitImage";
import { HeroStatForward } from "@/components/site-shell/sections/hero/HeroStatForward";
import { HeroVideoBackground } from "@/components/site-shell/sections/hero/HeroVideoBackground";
import { HeroSplitImagePremium } from "@/components/site-shell/sections/hero/HeroSplitImagePremium";

export const heroVariants = {
  "split-image": HeroSplitImage,
  "stat-forward": HeroStatForward,
  "video-background": HeroVideoBackground,
  "split-image-premium": HeroSplitImagePremium,
};

export const heroDefaultVariant = "split-image";
