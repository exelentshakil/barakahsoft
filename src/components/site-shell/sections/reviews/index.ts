import { ReviewsGrid } from "@/components/site-shell/sections/reviews/ReviewsGrid";
import { ReviewsCarousel } from "@/components/site-shell/sections/reviews/ReviewsCarousel";
import { ReviewsCarouselPremium } from "@/components/site-shell/sections/reviews/ReviewsCarouselPremium";

export const reviewsVariants = {
  grid: ReviewsGrid,
  carousel: ReviewsCarousel,
  "carousel-premium": ReviewsCarouselPremium,
};

export const reviewsDefaultVariant = "grid";
