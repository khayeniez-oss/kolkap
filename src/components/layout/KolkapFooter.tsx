import Link from "next/link";
import KolkapLogo from "@/components/brand/KolkapLogo";

export default function KolkapFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-[#07111F]">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 text-sm font-medium leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} KolKap. Powered by Tetamo Pty Ltd.</p>

          <p className="max-w-2xl sm:text-right">
            Tetamo Pty Ltd (ABN 18 689 780 970) · 168 Kent St, Sydney NSW 2000,
            Australia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}