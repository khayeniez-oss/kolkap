import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  HeartHandshake,
  Languages,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

type Card = {
  title: string;
  text: string;
};

const trustPills = [
  "AI staff for businesses",
  "Built from Australia",
  "WhatsApp connected",
  "English-first workspace",
];

const storyText = [
  "Many businesses receive the same questions every day. Customers ask about pricing, availability, services, bookings, products, policies, and next steps. Business owners and teams often lose hours repeating the same replies.",
  "Kolkap was created because we believe businesses need AI that feels like helpful staff, not another complicated tool. AI should understand the business, support customer conversations, and make daily work easier.",
  "Our goal is to give businesses a simple way to use AI with confidence, while keeping humans in control of the customer experience.",
];

const values: Card[] = [
  {
    title: "Simple for business users",
    text: "AI should feel easy for owners and teams to use, even if they are not technical.",
  },
  {
    title: "Business knowledge matters",
    text: "Good AI staff should understand the business, its tone, its services, and its customer needs.",
  },
  {
    title: "Humans stay in control",
    text: "AI should support teams and improve speed, while businesses remain responsible for their customer experience.",
  },
  {
    title: "Customer trust comes first",
    text: "Clear communication, responsible AI use, privacy, and honest billing matter.",
  },
  {
    title: "Messaging should be organized",
    text: "Customer conversations should be easier to manage across WhatsApp, inbox, and supported channels.",
  },
  {
    title: "Growth should feel manageable",
    text: "As a business grows, AI should help the team handle more conversations without losing quality.",
  },
];

const serveList = [
  "Real estate businesses",
  "Hotels, villas, and accommodation",
  "Travel and tourism businesses",
  "Restaurants and cafes",
  "Clinics, beauty, and wellness businesses",
  "Retail and online shops",
  "Agencies and professional services",
  "Local businesses using WhatsApp for leads",
];

const languageList = ["English", "Bahasa Indonesia", "Chinese", "Malay"];

const valueIcons: LucideIcon[] = [
  Lightbulb,
  Building2,
  HeartHandshake,
  ShieldCheck,
  MessageCircle,
  UsersRound,
];

export default function AboutPage() {
  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            About Us
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            We are building AI staff for modern businesses.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            Kolkap exists to make AI practical for real businesses. Our focus is
            simple: help businesses serve customers faster, stay organized, and
            use AI in a way that feels clear, useful, and business-ready.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="h-6 w-6" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              View Pricing
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {trustPills.map((pill) => (
              <span
                key={pill}
                className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Building2 className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Our Story
          </p>

          <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Kolkap was created for businesses that need daily support.
          </h2>

          <div className="mt-7 grid gap-5">
            {storyText.map((text) => (
              <p
                key={text}
                className="max-w-5xl text-lg font-semibold leading-8 text-slate-600"
              >
                {text}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <Target className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
            Our Mission
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            Make AI staff simple, useful, and accessible for real businesses.
          </h2>

          <p className="mt-6 text-lg font-semibold leading-8 text-slate-300">
            Our mission is to help businesses save time, reply faster, support
            customers better, and reduce repetitive work with AI staff that is
            easy to set up and easy to use.
          </p>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Globe2 className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Our Vision
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            A trusted AI staff platform for businesses across multilingual
            markets.
          </h2>

          <p className="mt-6 text-lg font-semibold leading-8 text-slate-600">
            Our vision is for Kolkap to become a trusted AI staff platform for
            businesses, starting from Australia and growing into markets where
            businesses need multilingual customer support, messaging support, and
            practical AI-powered operations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            What We Believe
          </p>

          <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            AI should support business, not make it complicated.
          </h2>

          <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
            Kolkap is built around simple values that guide our product,
            customer experience, and long-term direction.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => {
              const Icon = valueIcons[index] || CheckCircle2;

              return (
                <div
                  key={value.title}
                  className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    {value.title}
                  </h3>

                  <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                    {value.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <UsersRound className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Who We Serve
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            Built for service businesses, local businesses, teams, and growing
            companies.
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            Kolkap is useful for businesses that receive customer questions,
            leads, bookings, inquiries, support requests, or repetitive
            messages.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {serveList.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4 text-base font-black text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <Languages className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
            Languages
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            Built for multilingual business support.
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-300">
            Kolkap supports English, Indonesian, Chinese, and Malay so
            businesses can serve customers across different markets.
          </p>

          <div className="mt-8 grid gap-3">
            {languageList.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 text-base font-black text-white"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <HeartHandshake className="h-8 w-8" />
          </div>

          <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Kolkap is building the future of AI staff for business.
          </h2>

          <p className="mt-5 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            Create AI staff, support customer conversations, and help your team
            work faster with a simple business-ready AI workspace.
          </p>

          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
          >
            Start Free Trial
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </section>
    </main>
  );
}