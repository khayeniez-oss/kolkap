import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bot,
  CreditCard,
  Database,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

type PolicySection = {
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
    title: "AI staff data",
    text: "Kolkap processes business knowledge, prompts, messages, and AI staff settings to generate useful business replies and content.",
  },
  {
    title: "Messages and leads",
    text: "Customer conversations and lead details may be processed when businesses use Kolkap for inbox, chat, WhatsApp, or future channels.",
  },
  {
    title: "Billing by Stripe",
    text: "Kolkap does not store full card numbers. Payment methods and billing are handled by Stripe.",
  },
  {
    title: "Account deletion",
    text: "Users can delete their account from Settings > Delete Account.",
  },
];

const summaryItems = [
  {
    icon: <UserRound className="h-5 w-5" />,
    text: "We collect account, business, workspace, usage, and billing-related data.",
  },
  {
    icon: <Database className="h-5 w-5" />,
    text: "Your business workspace data is used to power your own AI staff.",
  },
  {
    icon: <LockKeyhole className="h-5 w-5" />,
    text: "We do not sell your personal information.",
  },
  {
    icon: <Globe2 className="h-5 w-5" />,
    text: "Third-party providers may process data to help operate Kolkap.",
  },
  {
    icon: <Trash2 className="h-5 w-5" />,
    text: "You can delete your account from Settings.",
  },
];

const policySections: PolicySection[] = [
  {
    title: "1. Introduction",
    text: [
      "Kolkap is an AI staff platform for businesses. Kolkap helps business users create AI staff to support customer replies, inbox support, content generation, business knowledge handling, leads, usage tracking, billing, and future messaging channels.",
      "This Privacy Policy explains what information we collect, how we use it, how we protect it, and how users can request or complete account deletion.",
    ],
  },
  {
    title: "2. Information We Collect",
    text: [
      "We may collect account information such as your name, email address, login details, and account preferences.",
      "We may collect business information such as business name, business type, business email, business phone number, WhatsApp number, business address, country, timezone, and workspace settings.",
      "We may collect AI workspace information such as AI staff settings, business knowledge, AI instructions, reply language, reply tone, handover rules, and automation preferences.",
      "We may collect customer communication data such as messages, conversations, leads, customer names, contact details, inquiry details, handover status, and inbox activity when you use Kolkap for customer communication.",
      "We may collect usage and billing information such as AI credits, usage events, plan status, trial status, subscription status, invoices, and billing-related records.",
      "We may collect technical information such as browser type, device information, IP address, app activity, logs, cookies, session data, and security-related events.",
    ],
  },
  {
    title: "3. Business Workspace and AI Staff Data",
    text: [
      "Each Kolkap business workspace is intended to be private to that business account and its approved team members.",
      "Business knowledge, AI staff instructions, workspace settings, and uploaded business information are used to help your AI staff generate more relevant replies, content, and business support.",
      "Kolkap does not intentionally use one business customer’s private workspace data to serve another business customer.",
    ],
  },
  {
    title: "4. Customer Messages and Leads",
    text: [
      "If you use Kolkap to manage customer conversations, leads, inbox replies, website chat, WhatsApp, or future messaging channels, Kolkap may process customer messages and lead details on your behalf.",
      "You are responsible for ensuring that you have the right to upload, connect, or process customer information inside your Kolkap workspace.",
      "Kolkap uses this information to display conversations, help generate AI replies, support handover to humans, manage leads, and track usage.",
    ],
  },
  {
    title: "5. How We Use Information",
    text: [
      "We use information to create and manage user accounts, create business workspaces, provide AI staff functionality, generate AI replies and content, manage conversations and leads, process usage credits, provide billing and subscription access, improve platform reliability, prevent abuse, provide support, and comply with legal obligations.",
      "We may also use limited technical and usage information to monitor performance, fix errors, improve security, and understand how Kolkap is used.",
    ],
  },
  {
    title: "6. AI Processing",
    text: [
      "Kolkap uses AI models and AI service providers to generate replies, content, summaries, drafts, and business assistance based on the information provided by users.",
      "Business knowledge, prompts, messages, AI staff settings, and conversation context may be processed by AI providers to generate outputs.",
      "AI outputs may be inaccurate or incomplete. Users should review AI outputs before using them in sensitive, legal, financial, medical, safety, or high-risk situations.",
      "Users are responsible for the information they upload and for how they use AI-generated outputs.",
    ],
  },
  {
    title: "7. Payments and Billing",
    text: [
      "Kolkap may use Stripe or another payment provider to process payment methods, subscriptions, invoices, billing status, free trials, and related payment records.",
      "Kolkap does not store full card numbers. Payment method details are handled by the payment provider.",
      "We may store payment-related references such as customer ID, subscription ID, price ID, billing status, trial dates, invoice status, and transaction-related records so we can manage your subscription and account access.",
    ],
  },
  {
    title: "8. Third-Party Services",
    text: [
      "Kolkap may use third-party services to operate the platform, including Supabase for authentication, database, and storage; Stripe for payment processing and billing; AI providers for AI generation; hosting providers for app and website hosting; and communication providers for future messaging channels such as WhatsApp, website chat, or email.",
      "These third-party services may process information only as needed to provide their services to Kolkap and our users.",
    ],
  },
  {
    title: "9. Data Sharing",
    text: [
      "We do not sell your personal information.",
      "We may share information with service providers who help us operate Kolkap, process payments, provide AI functionality, host the platform, support security, or provide customer support.",
      "We may disclose information if required by law, legal process, fraud prevention, security protection, or to protect the rights and safety of Kolkap, our users, or others.",
    ],
  },
  {
    title: "10. Data Security",
    text: [
      "We use reasonable technical, administrative, and organizational measures to protect user data and workspace information.",
      "No online service can guarantee absolute security. Users should keep their login details safe and only add trusted team members to their workspace.",
    ],
  },
  {
    title: "11. Data Retention",
    text: [
      "We keep account, workspace, usage, and billing data for as long as needed to provide Kolkap, comply with legal obligations, resolve disputes, prevent abuse, and maintain business records.",
      "When an account is deleted, we delete or anonymize associated account and workspace data unless we are required to retain certain records for legal, tax, billing, security, fraud-prevention, or dispute-handling reasons.",
    ],
  },
  {
    title: "12. Account Deletion",
    text: [
      "Users can delete their Kolkap account from Settings > Delete Account.",
      "Deleting an account may remove account access, business workspace data, AI staff setup, business knowledge, conversations, leads, usage records, and related workspace data.",
      "Some records may be retained where required for legal, tax, billing, security, fraud-prevention, or dispute-handling purposes.",
    ],
  },
  {
    title: "13. User Rights and Choices",
    text: [
      "Depending on your location, you may have rights to access, correct, export, or delete your personal information.",
      "You may contact Kolkap to request help with account data, privacy questions, or deletion support.",
    ],
  },
  {
    title: "14. International Data Processing",
    text: [
      "Kolkap may process and store information using service providers located in different countries.",
      "By using Kolkap, you understand that your information may be processed outside your country of residence where our service providers operate.",
    ],
  },
  {
    title: "15. Children’s Privacy",
    text: [
      "Kolkap is intended for business users and is not designed for children.",
      "We do not knowingly collect personal information from children. If you believe a child has provided personal information to Kolkap, please contact us.",
    ],
  },
  {
    title: "16. Changes to This Policy",
    text: [
      "We may update this Privacy Policy from time to time. When we make changes, we will update the effective date on this page.",
      "Continued use of Kolkap after changes means you accept the updated Privacy Policy.",
    ],
  },
  {
    title: "17. Contact Us",
    text: [
      "For privacy questions, account deletion support, or data requests, contact Kolkap at support@kolkap.com.",
    ],
  },
];

const highlightIcons = [Bot, MessageCircle, CreditCard, Trash2];

export default function PrivacyPage() {
  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <ShieldCheck className="h-5 w-5" />
            Privacy Policy
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            Kolkap Privacy Policy
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            This Privacy Policy explains how Kolkap collects, uses, stores,
            shares, and protects information when businesses use Kolkap to create
            and manage AI staff.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              Effective date: June 2026
            </span>
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              AI staff platform
            </span>
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              Business workspace data
            </span>
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              Account deletion supported
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
            <FileText className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-black tracking-[-0.04em]">
            Plain-language privacy summary
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
          {policySections.map((section) => (
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
              Privacy questions?
            </h2>

            <p className="mt-4 text-xl font-semibold leading-9 text-slate-300">
              Contact Kolkap for privacy, data, or account deletion support.{" "}
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