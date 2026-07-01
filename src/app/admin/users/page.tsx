"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RoleFilter = "all" | "admin" | "customer" | "no_role";

type UserProfile = {
  id: string;
  email: string | null;
  role: string | null;
  full_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type UserStats = {
  total: number;
  admins: number;
  customers: number;
  noRole: number;
  recentSignups: number;
};

type PaginationState = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  from: number;
  to: number;
};

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "admin", label: "Admins" },
  { value: "customer", label: "Customers" },
  { value: "no_role", label: "No Role" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const EMPTY_STATS: UserStats = {
  total: 0,
  admins: 0,
  customers: 0,
  noRole: 0,
  recentSignups: 0,
};

const EMPTY_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  from: 0,
  to: 0,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getRoleLabel(role?: string | null) {
  const clean = String(role || "").trim();

  if (!clean) return "No role";

  if (clean.toLowerCase().includes("admin")) return "Admin";

  return clean;
}

function getRoleClass(role?: string | null) {
  const clean = String(role || "").toLowerCase().trim();

  if (clean.includes("admin")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (!clean) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function RoleBadge({ role }: { role?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getRoleClass(
        role
      )}`}
    >
      {getRoleLabel(role)}
    </span>
  );
}

export default function KolkapAdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<PaginationState>(EMPTY_PAGINATION);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredLabel = useMemo(() => {
    return ROLE_FILTERS.find((item) => item.value === roleFilter)?.label || "All Users";
  }, [roleFilter]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadUsers(
    nextSearch = search,
    nextRoleFilter = roleFilter,
    nextPage = page,
    nextPageSize = pageSize
  ) {
    try {
      setLoading(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setUsers([]);
        setStats(EMPTY_STATS);
        setPagination(EMPTY_PAGINATION);
        return;
      }

      const params = new URLSearchParams({
        search: nextSearch,
        roleFilter: nextRoleFilter,
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load users.");
      }

      setUsers((result.users || []) as UserProfile[]);
      setStats((result.stats || EMPTY_STATS) as UserStats);
      setPagination((result.pagination || EMPTY_PAGINATION) as PaginationState);
    } catch (loadError) {
      console.error("Load Kolkap admin users error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }

  function submitSearch() {
    const clean = searchInput.trim();

    setSearch(clean);
    setPage(1);
    loadUsers(clean, roleFilter, 1, pageSize);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
    loadUsers("", roleFilter, 1, pageSize);
  }

  function changeRoleFilter(nextRoleFilter: RoleFilter) {
    setRoleFilter(nextRoleFilter);
    setPage(1);
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function goToPreviousPage() {
    if (!pagination.hasPreviousPage) return;
    setPage((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    if (!pagination.hasNextPage) return;
    setPage((prev) => prev + 1);
  }

  useEffect(() => {
    loadUsers(search, roleFilter, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, page, pageSize]);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Kolkap Admin
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Users
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              Review Kolkap user profiles, admin access, account roles, and
              recent signups. This first version is view-only for safe internal
              monitoring.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadUsers(search, roleFilter, page, pageSize)}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Total Users
            </p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
              Admins
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {stats.admins}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
              Customers
            </p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {stats.customers}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
              No Role
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {stats.noRole}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-500">
              New 7 Days
            </p>
            <p className="mt-2 text-3xl font-black text-purple-700">
              {stats.recentSignups}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex-1">
            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Search Users
            </label>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitSearch();
                  }}
                  placeholder="Search by email or full name"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#07111F]"
                />
              </div>

              <button
                type="button"
                onClick={submitSearch}
                className="rounded-2xl bg-[#07111F] px-5 py-3 text-sm font-black text-white"
              >
                Search
              </button>

              <button
                type="button"
                onClick={clearSearch}
                className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-sm font-black text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Page Size
            </label>

            <select
              value={pageSize}
              onChange={(event) => changePageSize(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none xl:w-[150px]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Role Filter
          </p>

          <div className="flex flex-wrap gap-2">
            {ROLE_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => changeRoleFilter(item.value)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  roleFilter === item.value
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-[#F7F9FA]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
            <p className="text-sm font-bold leading-6 text-blue-900">
              Admin access is checked by your protected API route. This page is
              for monitoring only. Role editing and user deletion are not added
              yet, so we do not accidentally break accounts.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">User Profiles</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Showing {filteredLabel}
                {search ? ` matching "${search}"` : ""}.
              </p>
            </div>

            {loading ? (
              <span className="text-sm font-bold text-slate-400">
                Loading...
              </span>
            ) : null}
          </div>
        </div>

        {!loading && users.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
            <div>
              <UsersRound className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-semibold text-slate-500">
                No users found for the current filter.
              </p>
            </div>
          </div>
        ) : null}

        {users.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#F7F9FA] text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">User ID</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4">Updated</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#07111F]">
                              {user.full_name || "No name"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              Kolkap profile
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {user.email || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-semibold text-slate-500">
                          {shortId(user.id)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-600">
                          {formatDate(user.created_at)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-600">
                          {formatDate(user.updated_at)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">
                        {user.full_name || "No name"}
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                        {user.email || "-"}
                      </p>
                    </div>

                    <RoleBadge role={user.role} />
                  </div>

                  <div className="mt-4 grid gap-3 rounded-2xl bg-[#F7F9FA] p-3 text-xs font-semibold text-slate-500">
                    <div>
                      <p className="font-black text-slate-700">User ID</p>
                      <p className="mt-1 font-mono">{shortId(user.id)}</p>
                    </div>

                    <div>
                      <p className="font-black text-slate-700">Created</p>
                      <p className="mt-1">{formatDate(user.created_at)}</p>
                    </div>

                    <div>
                      <p className="font-black text-slate-700">Updated</p>
                      <p className="mt-1">{formatDate(user.updated_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="border-t border-slate-100 bg-[#F7F9FA] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-semibold text-slate-500">
              Showing {pagination.from}-{pagination.to} of{" "}
              {pagination.totalCount} · Page {pagination.page} of{" "}
              {pagination.totalPages}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={!pagination.hasPreviousPage || loading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={!pagination.hasNextPage || loading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}