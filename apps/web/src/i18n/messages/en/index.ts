/**
 * English catalog barrel — the reference catalog every other locale mirrors.
 * Each feature is a namespace; keep this list and the per-locale folders in sync.
 */
import common from "./common.json";
import nav from "./nav.json";
import language from "./language.json";
import errors from "./errors.json";
import validation from "./validation.json";
import marketing from "./marketing.json";
import plans from "./plans.json";
import auth from "./auth.json";
import onboarding from "./onboarding.json";
import dashboard from "./dashboard.json";
import clients from "./clients.json";
import projects from "./projects.json";
import scans from "./scans.json";
import settings from "./settings.json";
import billing from "./billing.json";
import legal from "./legal.json";
import guides from "./guides.json";

const messages = {
  common,
  nav,
  language,
  errors,
  validation,
  marketing,
  plans,
  auth,
  onboarding,
  dashboard,
  clients,
  projects,
  scans,
  settings,
  billing,
  legal,
  guides,
};

export default messages;
