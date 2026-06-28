import Link from "next/link";

export default function KolkapFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-[#07111F]">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 text-sm font-medium leading-6 text-slate-500 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p>
              © {new Date().getFullYear()} Kolkap. Powered by Tetamo Pty Ltd.
            </p>

            <p className="mt-1">
              168 Kent St, Sydney NSW 2000, Australia. All rights reserved.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end sm:text-right"
          >
            <Link
              href="/about"
              className="font-black text-slate-600 transition hover:text-[#07111F]"
            >
              About Us
            </Link>

            <Link
              href="/pricing"
              className="font-black text-slate-600 transition hover:text-[#07111F]"
            >
              Pricing
            </Link>

            <Link
              href="/contact"
              className="font-black text-slate-600 transition hover:text-[#07111F]"
            >
              Contact
            </Link>

            <Link
              href="/privacy"
              className="font-black text-slate-600 transition hover:text-[#07111F]"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="font-black text-slate-600 transition hover:text-[#07111F]"
            >
              Terms & Conditions
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}