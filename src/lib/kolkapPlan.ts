export type KolkapPlanKey =
  | "starter"
  | "growth"
  | "professional"
  | "business"
  | "enterprise"
  | "free_trial"
  | "pro";

export type KolkapCreditRule = {
  label: string;
  credits: number;
  description: string;
};

export type KolkapTopUpPackage = {
  id: string;
  priceUsd: number;
  credits: number;
  label: string;
};

export type KolkapPlan = {
  key: KolkapPlanKey;
  name: string;
  priceLabel: string;
  monthlyPriceUsd: number | null;
  aiStaffLimit: number | "custom";
  teamMemberLimit: number | "custom";
  monthlyCredits: number | "custom";
  trialDays: number;
  cardRequiredForTrial: boolean;
  trialNote: string;
  description: string;
  features: string[];
  recommended?: boolean;
  legacyKey?: boolean;
};

export type KolkapWorkspacePlanStatus = {
  businessName: string;
  planKey: KolkapPlanKey;
  planName: string;
  status: "trial" | "active" | "past_due" | "cancelled";
  trialDaysRemaining: number;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  aiStaffLimit: number | "custom";
  aiStaffUsed: number;
  whatsappStatus: "not_connected" | "connected" | "pending";
  goLiveStatus: "draft" | "testing" | "live";
};

export const KOLKAP_TRIAL_DAYS = 7;

export const KOLKAP_TRIAL_NOTE =
  "Start with a 7-day free trial. Card is required. Monthly billing starts automatically after the trial unless cancelled before the trial ends.";

export const KOLKAP_DEFAULT_CREDIT_COST = 1;

export const kolkapPlans: Record<KolkapPlanKey, KolkapPlan> = {
  starter: {
    key: "starter",
    name: "Starter AI",
    priceLabel: "$79/month",
    monthlyPriceUsd: 79,
    aiStaffLimit: 1,
    teamMemberLimit: 1,
    monthlyCredits: 2000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    description:
      "For small businesses that need one AI assistant to support replies, content, and customer questions.",
    features: [
      "7-day free trial",
      "Card required to start trial",
      "2,000 AI credits/month",
      "1 AI staff",
      "1 workspace",
      "Knowledge Base",
      "Content Studio",
      "Test AI",
      "Inbox manual AI replies",
      "Usage dashboard",
    ],
  },

  growth: {
    key: "growth",
    name: "Growth AI",
    priceLabel: "$149/month",
    monthlyPriceUsd: 149,
    aiStaffLimit: 3,
    teamMemberLimit: 3,
    monthlyCredits: 5000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    description:
      "For active businesses that need more AI usage, more team access, and stronger inbox support.",
    features: [
      "7-day free trial",
      "Card required to start trial",
      "5,000 AI credits/month",
      "3 AI staff",
      "3 team members",
      "Knowledge Base",
      "Content Studio",
      "Test AI",
      "Inbox AI replies",
      "Website chat ready",
      "Usage dashboard",
    ],
  },

  professional: {
    key: "professional",
    name: "Professional AI",
    priceLabel: "$249/month",
    monthlyPriceUsd: 249,
    aiStaffLimit: 5,
    teamMemberLimit: 10,
    monthlyCredits: 12000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    recommended: true,
    description:
      "For growing businesses with higher message volume, more team members, and more AI staff.",
    features: [
      "7-day free trial",
      "Card required to start trial",
      "12,000 AI credits/month",
      "5 AI staff",
      "10 team members",
      "Advanced Knowledge Base",
      "Content Studio",
      "Test AI",
      "Inbox AI replies",
      "WhatsApp / website chat ready",
      "Auto-reply controls",
      "Reports",
      "Usage dashboard",
    ],
  },

  business: {
    key: "business",
    name: "Business AI",
    priceLabel: "$399/month",
    monthlyPriceUsd: 399,
    aiStaffLimit: 10,
    teamMemberLimit: "custom",
    monthlyCredits: 25000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    description:
      "For larger teams, agencies, and multi-channel businesses that need stronger automation and support.",
    features: [
      "7-day free trial",
      "Card required to start trial",
      "25,000 AI credits/month",
      "10 AI staff",
      "Custom team members",
      "Multi-channel AI",
      "Team inbox",
      "Advanced Knowledge Base",
      "Auto-reply controls",
      "Priority support",
      "Advanced reports",
      "Higher automation limit",
      "Usage dashboard",
    ],
  },

  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    monthlyPriceUsd: null,
    aiStaffLimit: "custom",
    teamMemberLimit: "custom",
    monthlyCredits: "custom",
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: false,
    trialNote:
      "Enterprise plans are customized based on business needs, volume, integrations, and onboarding requirements.",
    description:
      "For franchises, agencies, multi-location businesses, and companies that need custom setup.",
    features: [
      "Custom AI credits",
      "Custom AI staff",
      "Custom team members",
      "Custom AI setup",
      "Custom integrations",
      "Franchise / agency ready",
      "Multi-location support",
      "Priority onboarding",
      "Dedicated setup",
      "Advanced reporting",
    ],
  },

  free_trial: {
    key: "free_trial",
    name: "7-Day Free Trial",
    priceLabel: "Free for 7 days",
    monthlyPriceUsd: 0,
    aiStaffLimit: 1,
    teamMemberLimit: 1,
    monthlyCredits: 100,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    legacyKey: true,
    description:
      "A short trial to test Kolkap before the selected monthly plan begins.",
    features: [
      "7-day free trial",
      "Card required",
      "100 trial credits",
      "1 AI staff",
      "Knowledge Base",
      "Content Studio",
      "Test AI",
      "Inbox manual AI replies",
    ],
  },

  pro: {
    key: "pro",
    name: "Professional AI",
    priceLabel: "$249/month",
    monthlyPriceUsd: 249,
    aiStaffLimit: 5,
    teamMemberLimit: 10,
    monthlyCredits: 12000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    legacyKey: true,
    recommended: true,
    description:
      "Legacy alias for Professional AI. Use professional for new code.",
    features: [
      "7-day free trial",
      "Card required to start trial",
      "12,000 AI credits/month",
      "5 AI staff",
      "10 team members",
      "Advanced Knowledge Base",
      "Content Studio",
      "Test AI",
      "Inbox AI replies",
      "WhatsApp / website chat ready",
      "Auto-reply controls",
      "Reports",
      "Usage dashboard",
    ],
  },
};

export const kolkapCreditRules: KolkapCreditRule[] = [
  {
    label: "AI reply",
    credits: 1,
    description:
      "A normal AI reply generated for Inbox, WhatsApp, website chat, or customer support.",
  },
  {
    label: "Test AI reply",
    credits: 1,
    description: "A test reply generated before going live.",
  },
  {
    label: "Content generation",
    credits: 1,
    description:
      "A normal content generation from Content Studio, such as a caption, announcement, promotion, or sales message.",
  },
  {
    label: "Email AI draft / reply",
    credits: 1,
    description: "A normal AI-generated email draft or reply.",
  },
  {
    label: "Long content",
    credits: 3,
    description:
      "A longer article, long-form response, or more detailed business content.",
  },
  {
    label: "Campaign pack",
    credits: 5,
    description:
      "A larger content pack such as campaign copy, multiple captions, or a script package.",
  },
];

export const kolkapTopUpPackages: KolkapTopUpPackage[] = [
  {
    id: "topup_15",
    priceUsd: 15,
    credits: 250,
    label: "$15 = 250 credits",
  },
  {
    id: "topup_30",
    priceUsd: 30,
    credits: 600,
    label: "$30 = 600 credits",
  },
  {
    id: "topup_60",
    priceUsd: 60,
    credits: 1300,
    label: "$60 = 1,300 credits",
  },
  {
    id: "topup_100",
    priceUsd: 100,
    credits: 2500,
    label: "$100 = 2,500 credits",
  },
  {
    id: "topup_250",
    priceUsd: 250,
    credits: 7000,
    label: "$250 = 7,000 credits",
  },
];

export const demoWorkspacePlanStatus: KolkapWorkspacePlanStatus = {
  businessName: "Demo Business",
  planKey: "starter",
  planName: kolkapPlans.starter.name,
  status: "trial",
  trialDaysRemaining: 7,
  creditsTotal: 2000,
  creditsUsed: 1,
  creditsRemaining: 1999,
  aiStaffLimit: 1,
  aiStaffUsed: 1,
  whatsappStatus: "not_connected",
  goLiveStatus: "draft",
};

export function getKolkapPlan(planKey: KolkapPlanKey) {
  return kolkapPlans[planKey] || kolkapPlans.starter;
}

export function getCreditUsagePercent(status: KolkapWorkspacePlanStatus) {
  if (status.creditsTotal <= 0) return 0;

  return Math.min(
    100,
    Math.round((status.creditsUsed / status.creditsTotal) * 100)
  );
}

export function getCreditRemainingPercent(status: KolkapWorkspacePlanStatus) {
  if (status.creditsTotal <= 0) return 0;

  return Math.min(
    100,
    Math.round((status.creditsRemaining / status.creditsTotal) * 100)
  );
}

export function canCreateMoreAIStaff(status: KolkapWorkspacePlanStatus) {
  if (status.aiStaffLimit === "custom") return true;

  return status.aiStaffUsed < status.aiStaffLimit;
}

export function getAIStaffLimitLabel(status: KolkapWorkspacePlanStatus) {
  if (status.aiStaffLimit === "custom") return "Custom";

  return `${status.aiStaffUsed}/${status.aiStaffLimit}`;
}

export function getPlanCreditLabel(plan: KolkapPlan) {
  if (plan.monthlyCredits === "custom") return "Custom credits";

  if (plan.key === "free_trial") return `${plan.monthlyCredits} trial credits`;

  return `${plan.monthlyCredits.toLocaleString()} credits/month`;
}

export function getPlanAIStaffLabel(plan: KolkapPlan) {
  if (plan.aiStaffLimit === "custom") return "Custom AI staff";

  return `${plan.aiStaffLimit} AI staff`;
}

export function getPlanTeamMemberLabel(plan: KolkapPlan) {
  if (plan.teamMemberLimit === "custom") return "Custom team members";

  return `${plan.teamMemberLimit} team member${
    plan.teamMemberLimit === 1 ? "" : "s"
  }`;
}

export function getCreditCostLabel(credits = KOLKAP_DEFAULT_CREDIT_COST) {
  return `${credits} Credit${credits === 1 ? "" : "s"}`;
}

export function getGenerateButtonLabel(action = "Generate", credits = 1) {
  return `${action} for ${getCreditCostLabel(credits)}`;
}