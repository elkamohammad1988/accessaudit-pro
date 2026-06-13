export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./types";

import type { Tables } from "./types";

/** Row aliases for the tables the app touches most. */
export type Profile = Tables<"profiles">;
export type Organization = Tables<"organizations">;
export type Client = Tables<"clients">;
export type Project = Tables<"projects">;
export type Scan = Tables<"scans">;
export type ScanPage = Tables<"scan_pages">;
export type Violation = Tables<"violations">;
export type Subscription = Tables<"subscriptions">;
