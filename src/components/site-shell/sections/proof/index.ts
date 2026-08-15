import { ProofBar } from "@/components/site-shell/sections/proof/ProofBar";
import { ProofStatGrid } from "@/components/site-shell/sections/proof/ProofStatGrid";
import { ProofStatGridPremium } from "@/components/site-shell/sections/proof/ProofStatGridPremium";

export const proofVariants = {
  bar: ProofBar,
  "stat-grid": ProofStatGrid,
  "stat-grid-premium": ProofStatGridPremium,
};

export const proofDefaultVariant = "bar";
