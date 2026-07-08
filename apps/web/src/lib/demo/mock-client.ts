/**
 * Mock Supabase client — a small, faithful stand-in for the subset of the
 * Supabase JS API this app actually uses, backed by the in-memory `demoDb`
 * (lib/demo/store). Returned by `createClient`/`createAdminClient` when no
 * Supabase project is configured, so the whole app runs locally on mock data.
 *
 * It implements: `auth.*` (a permanently signed-in demo user), a chainable +
 * thenable PostgREST-style query builder (`from().select().eq()…`), the four
 * quota/rate-limit `rpc()`s, and a no-op realtime `channel()`. Reads and writes
 * hit the shared in-memory tables, so create → detail flows work end-to-end.
 *
 * Typed loosely internally, then cast to `SupabaseClient<Database>` at the
 * boundary so every call site keeps full type-safety against the real client.
 *
 * Internally this file leans on `any` for the dynamic row/query shapes — that's
 * deliberate: the payoff is that the cast at the boundary keeps every *caller*
 * fully typed against the real Supabase client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@accessaudit/database";
import {
  demoDb,
  demoSession,
  demoUser,
  DEMO_ORG_ID,
  totalsFor,
} from "./store";

type Row = Record<string, any>;
type Result = { data: any; error: any; count: number | null; status: number; statusText: string };

const ok = (data: any, count: number | null = null): Result => ({
  data,
  error: null,
  count,
  status: 200,
  statusText: "OK",
});

const NO_ROWS = {
  code: "PGRST116",
  message: "JSON object requested, multiple (or no) rows returned",
  details: "The result contains 0 rows",
  hint: null,
};

function newUuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for environments without crypto.randomUUID.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

type Cmp = (a: any, b: any) => boolean;
const cmp: Record<string, Cmp> = {
  eq: (a, b) => a === b,
  neq: (a, b) => a !== b,
  gt: (a, b) => a > b,
  gte: (a, b) => a >= b,
  lt: (a, b) => a < b,
  lte: (a, b) => a <= b,
  is: (a, b) => (b === null ? a === null || a === undefined : a === b),
  in: (a, b) => Array.isArray(b) && b.includes(a),
  like: (a, b) => typeof a === "string" && a.includes(String(b).replace(/%/g, "")),
  ilike: (a, b) =>
    typeof a === "string" && a.toLowerCase().includes(String(b).replace(/%/g, "").toLowerCase()),
};

/** Chainable, thenable query builder over one in-memory table. */
class MockQuery implements PromiseLike<Result> {
  private conds: Array<(r: Row) => boolean> = [];
  private ordering: { col: string; asc: boolean } | null = null;
  private limitN: number | null = null;
  private rangeTo: number | null = null;
  private rangeFrom = 0;
  private wantCount = false;
  private headOnly = false;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private payload: any = null;
  private returning: "many" | "single" | "maybe" = "many";
  private didSelect = false;

  constructor(private table: string) {}

  private get rows(): Row[] {
    return (demoDb[this.table] ??= []);
  }

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    this.didSelect = true;
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(values: any) {
    this.mode = "insert";
    this.payload = values;
    return this;
  }
  update(values: any) {
    this.mode = "update";
    this.payload = values;
    return this;
  }
  upsert(values: any, _opts?: { onConflict?: string }) {
    this.mode = "insert";
    this.payload = values;
    return this;
  }
  delete() {
    this.mode = "delete";
    return this;
  }

  private where(col: string, op: string, val: any) {
    const fn = cmp[op] ?? cmp.eq;
    this.conds.push((r) => fn(r[col], val));
    return this;
  }
  eq(col: string, val: any) { return this.where(col, "eq", val); }
  neq(col: string, val: any) { return this.where(col, "neq", val); }
  gt(col: string, val: any) { return this.where(col, "gt", val); }
  gte(col: string, val: any) { return this.where(col, "gte", val); }
  lt(col: string, val: any) { return this.where(col, "lt", val); }
  lte(col: string, val: any) { return this.where(col, "lte", val); }
  is(col: string, val: any) { return this.where(col, "is", val); }
  in(col: string, val: any[]) { return this.where(col, "in", val); }
  like(col: string, val: any) { return this.where(col, "like", val); }
  ilike(col: string, val: any) { return this.where(col, "ilike", val); }
  filter(col: string, op: string, val: any) { return this.where(col, op, val); }
  /**
   * PostgREST `or(...)` — a comma-separated list of `column.operator.value`
   * clauses combined with OR (e.g. `archived_at.is.null,id.eq.<uuid>`). The row
   * passes if ANY clause matches. (Values here never contain commas in this app,
   * so a plain comma split is sufficient.)
   */
  or(filters: string) {
    const clauses = filters.split(",").map((clause) => {
      const firstDot = clause.indexOf(".");
      const secondDot = clause.indexOf(".", firstDot + 1);
      const col = clause.slice(0, firstDot);
      const op = clause.slice(firstDot + 1, secondDot);
      const raw = clause.slice(secondDot + 1);
      const val = raw === "null" ? null : raw === "true" ? true : raw === "false" ? false : raw;
      const fn = cmp[op] ?? cmp.eq;
      return (r: Row) => fn(r[col], val);
    });
    this.conds.push((r) => clauses.some((c) => c(r)));
    return this;
  }
  match(obj: Record<string, any>) {
    for (const [col, val] of Object.entries(obj)) this.where(col, "eq", val);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.ordering = { col, asc: opts?.ascending ?? true };
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  single() {
    this.returning = "single";
    return this;
  }
  maybeSingle() {
    this.returning = "maybe";
    return this;
  }

  private match_(r: Row) {
    return this.conds.every((c) => c(r));
  }

  private shape(list: Row[]): Result {
    if (this.headOnly) return ok(null, list.length);
    if (this.returning === "single") {
      return list.length ? ok(list[0]) : { ...ok(null), error: NO_ROWS, status: 406, statusText: "Not Acceptable" };
    }
    if (this.returning === "maybe") return ok(list[0] ?? null);
    return ok(list, this.wantCount ? list.length : null);
  }

  private run(): Result {
    if (this.mode === "insert") {
      const many = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = many.map((v: Row) => {
        const now = new Date().toISOString();
        const row: Row = { id: newUuid(), created_at: now, updated_at: now, ...v };
        this.rows.push(row);
        return row;
      });
      return this.didSelect ? this.shape(inserted) : ok(null);
    }
    if (this.mode === "update") {
      const affected = this.rows.filter((r) => this.match_(r));
      for (const r of affected) Object.assign(r, this.payload, { updated_at: new Date().toISOString() });
      return this.didSelect ? this.shape(affected) : ok(null);
    }
    if (this.mode === "delete") {
      const keep: Row[] = [];
      const removed: Row[] = [];
      for (const r of this.rows) (this.match_(r) ? removed : keep).push(r);
      demoDb[this.table] = keep;
      return this.didSelect ? this.shape(removed) : ok(null);
    }
    // select
    let list = this.rows.filter((r) => this.match_(r));
    if (this.ordering) {
      const { col, asc } = this.ordering;
      list = [...list].sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av < bv ? -1 : 1) * (asc ? 1 : -1);
      });
    }
    const total = list.length;
    if (this.rangeTo != null) list = list.slice(this.rangeFrom, this.rangeTo + 1);
    if (this.limitN != null) list = list.slice(0, this.limitN);
    const shaped = this.shape(list);
    // count reflects the full filtered set, not the paginated slice
    if (this.wantCount && !this.headOnly) shaped.count = total;
    return shaped;
  }

  then<TR = Result, TE = never>(
    onfulfilled?: ((value: Result) => TR | PromiseLike<TR>) | null,
    onrejected?: ((reason: any) => TE | PromiseLike<TE>) | null,
  ): PromiseLike<TR | TE> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

// ── RPC handlers ─────────────────────────────────────────────────────────────
function rpc(fn: string, args: any): Promise<{ data: any; error: any }> {
  const now = new Date().toISOString();
  switch (fn) {
    case "check_rate_limit":
      return Promise.resolve({ data: true, error: null });

    case "create_client_if_within_quota": {
      const id = newUuid();
      demoDb.clients.push({
        id,
        organization_id: args.p_org_id,
        name: args.p_name,
        contact_email: args.p_contact_email ?? null,
        logo_url: null,
        notes: args.p_notes ?? null,
        archived_at: null,
        created_at: now,
        updated_at: now,
      });
      return Promise.resolve({ data: id, error: null });
    }

    case "create_project_if_within_quota": {
      const id = newUuid();
      demoDb.projects.push({
        id,
        organization_id: args.p_org_id,
        client_id: args.p_client_id,
        name: args.p_name,
        base_url: args.p_base_url,
        archived_at: null,
        created_at: now,
        updated_at: now,
      });
      return Promise.resolve({ data: id, error: null });
    }

    case "create_scan_if_within_quota": {
      // Demo: complete the scan immediately with believable findings so the
      // create → report flow is fully satisfying (no worker runs locally).
      const id = newUuid();
      const urls: string[] = Array.isArray(args.p_target_urls) ? args.p_target_urls : [];
      const score = 74 + Math.round(((demoDb.scans.length * 13) % 20));
      const totals = totalsFor(score, demoDb.scans.length + 3);
      demoDb.scans.push({
        id,
        organization_id: args.p_org_id,
        project_id: args.p_project_id,
        initiated_by: demoUser.id,
        status: "completed",
        scan_type: args.p_scan_type,
        target_urls: urls,
        wcag_level: args.p_wcag_level,
        score,
        totals,
        pages_scanned: Math.max(1, urls.length),
        error_reason: null,
        share_token: null,
        is_public: false,
        shared_at: null,
        started_at: now,
        last_progress_at: now,
        finished_at: now,
        attempts: 1,
        created_at: now,
      });
      // A page + a couple of findings so the report detail renders.
      urls.slice(0, 3).forEach((url, i) => {
        const pageId = newUuid();
        demoDb.scan_pages.push({
          id: pageId,
          scan_id: id,
          organization_id: args.p_org_id,
          url,
          status: "ok",
          http_status: 200,
          score,
          totals,
          created_at: now,
        });
        if (i === 0) {
          demoDb.violations.push(
            {
              id: newUuid(),
              scan_page_id: pageId,
              organization_id: args.p_org_id,
              rule_id: "color-contrast",
              impact: "serious",
              wcag_criteria: ["1.4.3"],
              description: "Elements must meet minimum color contrast ratio thresholds.",
              help_text: "Increase text contrast to at least 4.5:1 (3:1 for large text).",
              nodes: [{ target: ["a.cta"], html: "<a …>", failureSummary: "Contrast 3.9:1, expected 4.5:1" }],
              help_url: "https://dequeuniversity.com/rules/axe/4.10/color-contrast",
              created_at: now,
            },
            {
              id: newUuid(),
              scan_page_id: pageId,
              organization_id: args.p_org_id,
              rule_id: "image-alt",
              impact: "critical",
              wcag_criteria: ["1.1.1"],
              description: "Images must have alternate text.",
              help_text: "Add an alt attribute describing each informative image.",
              nodes: [{ target: ["img.hero"], html: "<img …>", failureSummary: "Element has no alt attribute" }],
              help_url: "https://dequeuniversity.com/rules/axe/4.10/image-alt",
              created_at: now,
            },
          );
        }
      });
      return Promise.resolve({ data: id, error: null });
    }

    default:
      return Promise.resolve({ data: null, error: null });
  }
}

// ── No-op realtime channel ───────────────────────────────────────────────────
const channel = () => {
  const ch: any = {
    on: () => ch,
    subscribe: () => ch,
    unsubscribe: () => Promise.resolve("ok"),
  };
  return ch;
};

/** Build a mock client shaped like `SupabaseClient<Database>`. */
export function createMockClient(): SupabaseClient<Database> {
  const client = {
    auth: {
      getUser: async () => ({ data: { user: demoUser }, error: null }),
      getSession: async () => ({ data: { session: demoSession }, error: null }),
      getClaims: async () => ({ data: { claims: { sub: demoUser.id } }, error: null }),
      signInWithPassword: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
      // Demo: return a session so sign-up completes straight into the app (no real
      // confirmation email is sent locally, so the "check your email" branch would
      // otherwise dead-end the flow).
      signUp: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
      signOut: async () => ({ error: null }),
      resend: async () => ({ data: {}, error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      updateUser: async () => ({ data: { user: demoUser }, error: null }),
      verifyOtp: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
      exchangeCodeForSession: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      admin: {
        updateUserById: async () => ({ data: { user: demoUser }, error: null }),
      },
    },
    from: (table: string) => new MockQuery(table),
    rpc: (fn: string, args: any) => rpc(fn, args),
    channel,
    removeChannel: () => Promise.resolve("ok"),
    // Ensure any org-scoped default lands on the demo tenant if a caller reads it.
    _demoOrgId: DEMO_ORG_ID,
  };
  return client as unknown as SupabaseClient<Database>;
}
