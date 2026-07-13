import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  CreditCard,
  FileText,
  Mail,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  WalletCards,
} from "lucide-react";

type TermsSection = {
  title: string;
  text: string[];
};

type HighlightItem = {
  title: string;
  text: string;
};

const supportEmail = "support@kolkap.com";

const highlights: HighlightItem[] = [
  {
    title: "AI staff",
    text: "Kolkap helps businesses create AI staff for replies, content, inbox support, leads, and automation.",
  },
  {
    title: "WhatsApp messaging",
    text: "Kolkap supports business messaging through WhatsApp and other connected channels.",
  },
  {
    title: "Subscriptions",
    text: "Monthly subscriptions begin after the trial unless cancelled before the trial ends.",
  },
  {
    title: "No refunds",
    text: "Payments are non-refundable except where required by law.",
  },
];

const summaryItems = [
  {
    icon: <Bot className="h-5 w-5" />,
    text: "Kolkap provides AI staff tools for business replies, content, inbox, leads, WhatsApp, and supported channels.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    text: "AI outputs may be inaccurate. Users must review AI replies before relying on them.",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    text: "Subscriptions renew monthly after the trial unless cancelled before renewal.",
  },
  {
    icon: <RefreshCcw className="h-5 w-5" />,
    text: "Payments, subscriptions, unused time, setup work, and credits are non-refundable except where required by law.",
  },
  {
    icon: <Trash2 className="h-5 w-5" />,
    text: "Users can delete their account from Settings > Delete Account.",
  },
];

const termsSections: TermsSection[] = [
  {
    title: "1. Introduction",
    text: [
      "These Terms & Conditions apply when you access or use Kolkap, including our website, dashboard, AI staff tools, WhatsApp messaging features, inbox, leads, content tools, billing, credits, subscriptions, and related services.",
      "By creating an account, starting a trial, connecting a business workspace, using AI staff, connecting WhatsApp, or paying for Kolkap, you agree to these Terms.",
    ],
  },
  {
    title: "2. About Kolkap",
    text: [
      "Kolkap is an AI staff platform for businesses. It helps businesses create AI assistants for customer replies, content generation, inbox support, lead handling, business knowledge support, usage tracking, credits, billing, and supported messaging channels.",
      "Kolkap is designed to support business operations, but it does not replace professional judgment, legal advice, financial advice, medical advice, tax advice, or human responsibility.",
    ],
  },
  {
    title: "3. Accounts and Workspace Responsibility",
    text: [
      "You are responsible for your account, login details, business workspace, team access, business information, AI staff settings, and activity under your account.",
      "You must provide accurate business information and keep your account secure. You should only invite trusted team members to your workspace.",
      "You are responsible for making sure you have the right to upload, connect, or process any business information, customer information, messages, leads, or knowledge base content inside Kolkap.",
    ],
  },
  {
    title: "4. AI Staff and AI Outputs",
    text: [
      "Kolkap uses AI models to generate replies, content, drafts, summaries, suggestions, and business assistance based on the information provided in your workspace.",
      "AI outputs may be inaccurate, incomplete, outdated, or unsuitable for a particular situation. You are responsible for reviewing AI outputs before using, sending, publishing, or relying on them.",
      "You must not rely on Kolkap AI outputs as professional legal, financial, medical, tax, safety, or high-risk advice.",
      "You are responsible for how your business uses AI-generated replies and content, including replies sent through WhatsApp or other customer channels.",
    ],
  },
  {
    title: "5. WhatsApp and Messaging Channels",
    text: [
      "Kolkap supports AI replies and business messaging through connected channels, including WhatsApp, inbox, website chat, and other supported communication channels.",
      "When using WhatsApp through Kolkap, you are responsible for your WhatsApp Business account, phone number, business details, templates, customer communication, message content, consent, and compliance with WhatsApp, Meta, and applicable messaging rules.",
      "Kolkap is not responsible if WhatsApp, Meta, or another provider restricts, rejects, delays, suspends, disables, reviews, or changes access to your messaging account, phone number, templates, quality rating, or channel.",
      "AI replies sent through WhatsApp or other channels may use credits. You are responsible for reviewing your AI staff setup, auto-reply settings, handover rules, and message content before going live.",
    ],
  },
  {
    title: "6. Plans, Subscriptions, and Billing",
    text: [
      "Kolkap offers paid subscription plans such as Starter AI, Growth AI, Professional AI, Business AI, and custom Enterprise arrangements.",
      "Plans may include different AI staff limits, team member limits, monthly credits, usage limits, features, support levels, and channel access.",
      "Subscription fees are billed monthly unless otherwise stated. Pricing, features, limits, and credit rules may change from time to time.",
      "Payments are processed by Stripe or another payment provider. Kolkap does not store full card numbers.",
    ],
  },
  {
    title: "7. Free Trial",
    text: [
      "Kolkap may offer a 7-day free trial. A payment method may be required to activate the trial.",
      "You will not be charged today when activating the free trial. Monthly billing starts after the 7-day trial unless you cancel before the trial ends.",
      "If you do not cancel before the trial ends, your selected plan may automatically convert to a paid monthly subscription.",
      "Trial availability, duration, and eligibility may be changed or removed by Kolkap at any time.",
    ],
  },
  {
    title: "8. Non-Refundable Payments",
    text: [
      "All payments to Kolkap are non-refundable except where required by applicable law.",
      "This includes subscription fees, unused subscription time, setup work, unused credits, top-up credits, add-ons, and any paid services already purchased or activated.",
      "Cancelling a subscription stops future renewal but does not create a refund for the current billing period unless required by law.",
      "Nothing in these Terms limits any rights you may have under applicable consumer law.",
    ],
  },
  {
    title: "9. Cancellation",
    text: [
      "You may cancel your subscription before the next billing cycle. Cancellation stops future renewal.",
      "After cancellation, you may continue to have access until the end of the current paid billing period unless otherwise stated.",
      "Kolkap does not provide prorated refunds for partial months or unused access unless required by law.",
      "If a payment fails, your access may be limited, paused, or cancelled.",
    ],
  },
  {
    title: "10. Credits and Top-Ups",
    text: [
      "Kolkap uses AI credits to measure AI usage. AI replies, test replies, content generation, WhatsApp AI replies, website chat AI replies, inbox AI replies, and other AI actions may consume credits.",
      "Test AI, Inbox AI suggestions, and Website Chat AI replies use 3 credits.",
      "WhatsApp AI replies use 5 credits. Content Studio generations use 10 credits.",
      "Longer replies, campaign content, long-form content, or heavier AI actions may use more credits.",
      "Monthly plan credits may refresh according to your plan and billing cycle. Top-up credits may be purchased for additional usage.",
      "Top-up purchases and unused credits are non-refundable except where required by law.",
    ],
  },
  {
    title: "11. Third-Party Services",
    text: [
      "Kolkap may rely on third-party services including Supabase, Stripe, AI providers, hosting providers, WhatsApp, Meta, and other communication or infrastructure providers.",
      "Third-party services may have their own terms, policies, fees, approvals, restrictions, limits, outages, and compliance requirements.",
      "Kolkap is not responsible for third-party provider outages, restrictions, account reviews, pricing changes, policy changes, or service interruptions.",
    ],
  },
  {
    title: "12. Acceptable Use",
    text: [
      "You must not use Kolkap for illegal activity, spam, scams, fraud, harassment, abusive content, impersonation, hate, malware, deceptive activity, unauthorized messaging, or violation of third-party platform rules.",
      "You must not use Kolkap to send messages to people who have not consented where consent is required.",
      "You must not misuse AI staff to mislead customers, hide the nature of automated replies where disclosure is required, or violate customer rights.",
    ],
  },
  {
    title: "13. Service Availability",
    text: [
      "Kolkap aims to provide reliable service, but we do not guarantee uninterrupted, error-free, or always-available access.",
      "Availability may be affected by maintenance, updates, internet issues, payment providers, AI providers, Supabase, hosting providers, WhatsApp, Meta, or other third parties.",
      "Kolkap may update, change, suspend, or discontinue features where needed for security, reliability, legal, business, or technical reasons.",
    ],
  },
  {
    title: "14. Account Suspension or Termination",
    text: [
      "Kolkap may suspend, restrict, or terminate access if you fail to pay, misuse the platform, violate these Terms, create risk for Kolkap or other users, abuse AI or channel systems, or use the service unlawfully.",
      "Kolkap may also suspend access if required by law, security concerns, fraud prevention, provider restrictions, or platform integrity reasons.",
    ],
  },
  {
    title: "15. Account Deletion",
    text: [
      "Users can delete their Kolkap account from Settings > Delete Account.",
      "Deleting an account may remove account access, business workspace data, AI staff setup, business knowledge, conversations, leads, usage records, and related workspace data.",
      "Some records may be retained where required for legal, tax, billing, security, fraud-prevention, dispute-handling, or compliance reasons.",
    ],
  },
  {
    title: "16. Intellectual Property",
    text: [
      "Kolkap owns or licenses the platform, software, systems, user interface, branding, design, workflows, and related intellectual property.",
      "You remain responsible for the business content, knowledge base materials, messages, and customer information you upload or connect to Kolkap.",
      "Subject to these Terms, you may use AI outputs generated in your workspace for your business purposes, but you are responsible for reviewing and using those outputs lawfully.",
    ],
  },
  {
    title: "17. Limitation of Liability",
    text: [
      "To the maximum extent allowed by law, Kolkap is not responsible for lost profits, lost sales, missed leads, business interruption, customer disputes, wrong AI replies, message delays, third-party restrictions, platform downtime, or indirect losses.",
      "Kolkap does not guarantee that AI staff will produce perfect replies, increase revenue, close sales, avoid all errors, or replace human review.",
    ],
  },
  {
    title: "18. Changes to Terms",
    text: [
      "Kolkap may update these Terms, pricing, plans, features, credit rules, billing rules, or channel rules from time to time.",
      "When required, we will provide notice of material changes. Continued use of Kolkap after changes means you accept the updated Terms.",
    ],
  },
  {
    title: "19. Contact",
    text: [
      "For questions about these Terms, billing, subscriptions, cancellation, or account support, contact Kolkap at support@kolkap.com.",
    ],
  },
];

const highlightIcons = [Bot, MessageCircle, WalletCards, RefreshCcw];

export default function TermsPage() {
  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <FileText className="h-5 w-5" />
            Terms & Conditions
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            Kolkap Terms & Conditions
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            These Terms explain the rules for using Kolkap, including AI staff,
            WhatsApp messaging, subscriptions, credits, billing, cancellations,
            and account deletion.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              Effective date: June 2026
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              AI staff platform
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              WhatsApp connected
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              Non-refundable payments
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item, index) => {
            const Icon = highlightIcons[index] || Bot;

            return (
              <div
                key={item.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>

                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  {item.title}
                </h2>

                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-14">
        <aside className="h-fit rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8 lg:sticky lg:top-8">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-black tracking-[-0.04em]">
            Plain-language terms summary
          </h2>

          <div className="mt-6 grid gap-4">
            {summaryItems.map((item) => (
              <SummaryItem key={item.text} icon={item.icon} text={item.text} />
            ))}
          </div>

          <Link
            href="/"
            className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5"
          >
            Back to Kolkap
          </Link>
        </aside>

        <div className="grid gap-6">
          {termsSections.map((section) => (
            <section
              key={section.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8"
            >
              <h2 className="text-3xl font-black tracking-[-0.04em]">
                {section.title}
              </h2>

              <div className="mt-5 grid gap-4">
                {section.text.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-lg font-semibold leading-8 text-slate-600"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Mail className="h-8 w-8" />
            </div>

            <h2 className="text-4xl font-black tracking-[-0.05em]">
              Questions about these Terms?
            </h2>

            <p className="mt-4 text-xl font-semibold leading-9 text-slate-300">
              Contact Kolkap for terms, billing, subscription, or account
              support.{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="font-black text-[#7CFF3D] underline"
              >
                {supportEmail}
              </a>
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4">
      <div className="mt-1 text-[#07111F]">{icon}</div>

      <p className="text-base font-black leading-7 text-slate-700">{text}</p>
    </div>
  );
}