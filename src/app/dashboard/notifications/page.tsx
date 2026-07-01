import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CreditCard,
  HelpCircle,
  Inbox,
  MessageCircle,
  WalletCards,
} from "lucide-react";

const notificationTypes = [
  {
    title: "Customer messages",
    text: "New website chat and inbox messages will appear here.",
    icon: Inbox,
  },
  {
    title: "WhatsApp inquiries",
    text: "New WhatsApp conversations and handover alerts will appear here.",
    icon: MessageCircle,
  },
  {
    title: "Billing updates",
    text: "Payment, subscription, and trial reminders will appear here.",
    icon: CreditCard,
  },
  {
    title: "Credit reminders",
    text: "Low credit and top-up reminders will appear here.",
    icon: WalletCards,
  },
  {
    title: "Help Centre updates",
    text: "Updates from Kolkap about your help requests will appear here.",
    icon: HelpCircle,
  },
];

export default function DashboardNotificationsPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FA] px-5 py-8 text-[#07111F]">
      <section className="mx-auto grid max-w-7xl gap-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm shadow-slate-900/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-[#7CFF3D]">
            <Bell className="h-5 w-5" />
            Notification Centre
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Your Kolkap notifications will appear here.
          </h1>

          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
            Soon you will see new messages, WhatsApp inquiries, billing updates,
            credit reminders, and Help Centre updates in one place.
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
          <h2 className="text-2xl font-black tracking-[-0.04em]">
            Notification Categories
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            This first version prepares the Notification Centre page. The next
            step is connecting live notification counts and message alerts.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {notificationTypes.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-black tracking-[-0.04em]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-bold leading-6 text-blue-900">
            For urgent issues, use Help Centre and submit a request. Kolkap will
            get back to you within 24 hours.
          </p>
        </section>
      </section>
    </main>
  );
}