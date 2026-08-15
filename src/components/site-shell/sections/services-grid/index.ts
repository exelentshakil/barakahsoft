import { ServicesCardGrid } from "@/components/site-shell/sections/services-grid/ServicesCardGrid";
import { ServicesIconList } from "@/components/site-shell/sections/services-grid/ServicesIconList";
import { ServicesCardGridPremium } from "@/components/site-shell/sections/services-grid/ServicesCardGridPremium";

export const servicesGridVariants = {
  "card-grid": ServicesCardGrid,
  "icon-list": ServicesIconList,
  "card-grid-premium": ServicesCardGridPremium,
};

export const servicesGridDefaultVariant = "card-grid";
