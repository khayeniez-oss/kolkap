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
  priceAud: number;
  credits: number;
  label: string;
};

export type KolkapPlan = {
  key: KolkapPlanKey;
  name: string;
  priceLabel: string;
  monthlyPriceAud: number | null;
  aiStaffLimit: number | "custom";
  teamMemberLimit: number | "custom";
  whatsappNumberLimit: number | "custom";
  websiteChatLimit: number | "custom";
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
  "Payment method needed to activate your 7-day trial. You will not be charged today. Monthly billing starts automatically after the trial unless cancelled before the trial ends.";

export const KOLKAP_PRICE_NOTE = "All prices are in AUD and include GST.";

export const KOLKAP_DEFAULT_CREDIT_COST = 3;

export const KOLKAP_WEBSITE_CHAT_REPLY_MIN_CREDITS = 3;
export const KOLKAP_AI_GENERATION_MIN_CREDITS = 3;
export const KOLKAP_WHATSAPP_REPLY_MIN_CREDITS = 5;
export const KOLKAP_MANUAL_WHATSAPP_REPLY_MIN_CREDITS = 3;
export const KOLKAP_AI_STAFF_CREATE_CREDITS = 100;
export const KOLKAP_AI_STAFF_EDIT_CREDITS = 50;
export const KOLKAP_GENERATE_KNOWLEDGE_CREDITS = 150;

export function getWhatsAppReplyCreditCost(message = "") {
  const length = message.trim().length;

  if (length <= 250) return 5;
  if (length <= 500) return 8;
  if (length <= 1000) return 12;

  return 18;
}

export function getAIContentCreditCost(message = "") {
  const length = message.trim().length;

  if (length <= 500) return 3;
  if (length <= 1200) return 5;
  if (length <= 2500) return 8;
  if (length <= 5000) return 15;

  return 25;
}

export const kolkapPlans: Record<KolkapPlanKey, KolkapPlan> = {
  starter: {
    key: "starter",
    name: "Starter AI",
    priceLabel: "A$149/month incl. GST",
    monthlyPriceAud: 149,
    aiStaffLimit: 1,
    teamMemberLimit: 1,
    whatsappNumberLimit: 1,
    websiteChatLimit: 1,
    monthlyCredits: 2500,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    description:
      "For small businesses that need one AI staff assistant to support customer replies, content, and everyday questions.",
    features: [
      "7-day free trial",
      "Payment method needed to activate trial",
      "A$149/month incl. GST after trial",
      "2,500 credits/month",
      "1 AI staff",
      "1 team member",
      "1 WhatsApp number",
      "1 Website Chat",
      "1 workspace",
      "Business knowledge",
      "Content Studio",
      "Test AI",
      "Inbox manual AI replies",
      "Usage dashboard",
    ],
  },

  growth: {
    key: "growth",
    name: "Growth AI",
    priceLabel: "A$249/month incl. GST",
    monthlyPriceAud: 249,
    aiStaffLimit: 3,
    teamMemberLimit: 3,
    whatsappNumberLimit: 3,
    websiteChatLimit: 1,
    monthlyCredits: 6000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    description:
      "For active businesses that need more AI usage, more team access, and stronger inbox support.",
    features: [
      "7-day free trial",
      "Payment method needed to activate trial",
      "A$249/month incl. GST after trial",
      "6,000 credits/month",
      "3 AI staff",
      "3 team members",
      "3 WhatsApp numbers",
      "1 Website Chat",
      "Business knowledge",
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
    priceLabel: "A$399/month incl. GST",
    monthlyPriceAud: 399,
    aiStaffLimit: 5,
    teamMemberLimit: 10,
    whatsappNumberLimit: 5,
    websiteChatLimit: 1,
    monthlyCredits: 15000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    recommended: true,
    description:
      "For growing businesses with higher message volume, more team members, and more AI staff.",
    features: [
      "7-day free trial",
      "Payment method needed to activate trial",
      "A$399/month incl. GST after trial",
      "15,000 credits/month",
      "5 AI staff",
      "10 team members",
      "5 WhatsApp numbers",
      "1 Website Chat",
      "Advanced business knowledge",
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
    priceLabel: "A$699/month incl. GST",
    monthlyPriceAud: 699,
    aiStaffLimit: 10,
    teamMemberLimit: "custom",
    whatsappNumberLimit: 10,
    websiteChatLimit: 1,
    monthlyCredits: 35000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    description:
      "For larger teams, agencies, and multi-channel businesses that need stronger automation, reporting, and support.",
    features: [
      "7-day free trial",
      "Payment method needed to activate trial",
      "A$699/month incl. GST after trial",
      "35,000 credits/month",
      "10 AI staff",
      "Custom team members",
      "10 WhatsApp numbers",
      "1 Website Chat",
      "Multi-channel AI",
      "Team inbox",
      "Advanced business knowledge",
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
    monthlyPriceAud: null,
    aiStaffLimit: "custom",
    teamMemberLimit: "custom",
    whatsappNumberLimit: "custom",
    websiteChatLimit: "custom",
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
      "Custom WhatsApp numbers",
      "Custom Website Chat setup",
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
    monthlyPriceAud: 0,
    aiStaffLimit: 1,
    teamMemberLimit: 1,
    whatsappNumberLimit: 1,
    websiteChatLimit: 1,
    monthlyCredits: 100,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    legacyKey: true,
    description:
      "A short trial to test Kolkap before the selected monthly plan begins.",
    features: [
      "7-day free trial",
      "Payment method needed to activate trial",
      "100 trial credits",
      "1 AI staff",
      "1 team member",
      "1 WhatsApp number",
      "1 Website Chat",
      "Business knowledge",
      "Content Studio",
      "Test AI",
      "Inbox manual AI replies",
    ],
  },

  pro: {
    key: "pro",
    name: "Professional AI",
    priceLabel: "A$399/month incl. GST",
    monthlyPriceAud: 399,
    aiStaffLimit: 5,
    teamMemberLimit: 10,
    whatsappNumberLimit: 5,
    websiteChatLimit: 1,
    monthlyCredits: 15000,
    trialDays: KOLKAP_TRIAL_DAYS,
    cardRequiredForTrial: true,
    trialNote: KOLKAP_TRIAL_NOTE,
    legacyKey: true,
    recommended: true,
    description:
      "Legacy alias for Professional AI. Use professional for new code.",
    features: [
      "7-day free trial",
      "Payment method needed to activate trial",
      "A$399/month incl. GST after trial",
      "15,000 credits/month",
      "5 AI staff",
      "10 team members",
      "5 WhatsApp numbers",
      "1 Website Chat",
      "Advanced business knowledge",
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
    label: "Website chat AI reply",
    credits: KOLKAP_WEBSITE_CHAT_REPLY_MIN_CREDITS,
    description:
      "A normal AI reply generated for website chat or customer support.",
  },
  {
    label: "Inbox AI reply",
    credits: KOLKAP_AI_GENERATION_MIN_CREDITS,
    description:
      "A normal AI reply generated in the Kolkap inbox before sending to a customer.",
  },
  {
    label: "WhatsApp AI reply",
    credits: KOLKAP_WHATSAPP_REPLY_MIN_CREDITS,
    description:
      "A normal AI-generated WhatsApp reply sent inside an open customer service window. Longer replies may use more credits.",
  },
  {
    label: "Manual WhatsApp reply",
    credits: KOLKAP_MANUAL_WHATSAPP_REPLY_MIN_CREDITS,
    description:
      "A manually written WhatsApp reply sent through Kolkap without AI generation.",
  },
  {
    label: "Test AI reply",
    credits: KOLKAP_AI_GENERATION_MIN_CREDITS,
    description: "A test reply generated before going live.",
  },
  {
    label: "Content generation",
    credits: 5,
    description:
      "A normal content generation from Content Studio, such as a caption, announcement, promotion, or sales message.",
  },
  {
    label: "Long content",
    credits: 15,
    description:
      "A longer article, long-form response, or more detailed business content.",
  },
  {
    label: "Campaign pack",
    credits: 25,
    description:
      "A larger content pack such as campaign copy, multiple captions, or a script package.",
  },
];

export const kolkapTopUpPackages: KolkapTopUpPackage[] = [
  {
    id: "topup_25",
    priceAud: 25,
    credits: 250,
    label: "A$25 incl. GST = 250 credits",
  },
  {
    id: "topup_50",
    priceAud: 50,
    credits: 600,
    label: "A$50 incl. GST = 600 credits",
  },
  {
    id: "topup_100",
    priceAud: 100,
    credits: 1400,
    label: "A$100 incl. GST = 1,400 credits",
  },
  {
    id: "topup_200",
    priceAud: 200,
    credits: 3200,
    label: "A$200 incl. GST = 3,200 credits",
  },
  {
    id: "topup_500",
    priceAud: 500,
    credits: 9000,
    label: "A$500 incl. GST = 9,000 credits",
  },
];

export const demoWorkspacePlanStatus: KolkapWorkspacePlanStatus = {
  businessName: "Demo Business",
  planKey: "starter",
  planName: kolkapPlans.starter.name,
  status: "trial",
  trialDaysRemaining: 7,
  creditsTotal: 2500,
  creditsUsed: 3,
  creditsRemaining: 2497,
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

export function getPlanWhatsAppNumberLimitLabel(plan: KolkapPlan) {
  if (plan.whatsappNumberLimit === "custom") return "Custom WhatsApp numbers";

  return `${plan.whatsappNumberLimit} WhatsApp number${
    plan.whatsappNumberLimit === 1 ? "" : "s"
  }`;
}

export function getPlanWebsiteChatLimitLabel(plan: KolkapPlan) {
  if (plan.websiteChatLimit === "custom") return "Custom Website Chat";

  return `${plan.websiteChatLimit} Website Chat`;
}

export function canAddMoreWhatsAppNumbers(
  plan: KolkapPlan,
  currentWhatsAppNumbers: number
) {
  if (plan.whatsappNumberLimit === "custom") return true;

  return currentWhatsAppNumbers < plan.whatsappNumberLimit;
}

export function canAddMoreWebsiteChats(
  plan: KolkapPlan,
  currentWebsiteChats: number
) {
  if (plan.websiteChatLimit === "custom") return true;

  return currentWebsiteChats < plan.websiteChatLimit;
}

export function getCreditCostLabel(credits = KOLKAP_DEFAULT_CREDIT_COST) {
  return `${credits} Credit${credits === 1 ? "" : "s"}`;
}

export function getGenerateButtonLabel(
  action = "Generate",
  credits = KOLKAP_DEFAULT_CREDIT_COST
) {
  return `${action} for ${getCreditCostLabel(credits)}`;
}