// Merged pull requests to projects I don't maintain. Only merged work goes
// here: closed or open PRs stay off the list. Newest first.
export interface Contribution {
  project: string;
  repo: string;
  about: string;
  change: string;
  url: string;
  mergedAt: string;
}

// Things I started and keep alive myself.
export interface Maintained {
  name: string;
  repo: string;
  description: string;
  tech: string[];
}

export const contributions: Contribution[] = [
  {
    project: 'ferriskey',
    repo: 'ferriskey/ferriskey',
    about: 'An open-source identity and access management server written in Rust.',
    change: 'Advertised the token-exchange grant in the OpenID discovery document, so clients can find out the server supports it.',
    url: 'https://github.com/ferriskey/ferriskey/pull/1108',
    mergedAt: '2026-09-29',
  },
  {
    project: 'Uptime Kuma',
    repo: 'louislam/uptime-kuma',
    about: 'The self-hosted uptime monitor a lot of homelabs run.',
    change: 'Fixed the screenshot delay being silently dropped when you edited a browser-engine monitor.',
    url: 'https://github.com/louislam/uptime-kuma/pull/7515',
    mergedAt: '2026-07-17',
  },
  {
    project: 'dealve-tui',
    repo: 'kurama/dealve-tui',
    about: 'A terminal UI for browsing game deals, written in Rust.',
    change: 'Replaced in-memory filtering with live search against the IsThereAnyDeal API, so search covers the whole catalogue and not just what was loaded.',
    url: 'https://github.com/kurama/dealve-tui/pull/16',
    mergedAt: '2026-02-18',
  },
  {
    project: 'ClawHub',
    repo: 'openclaw/clawhub',
    about: 'The skill directory for the OpenClaw AI assistant.',
    change: 'Fixed a search timeout and the alignment of the skills page.',
    url: 'https://github.com/openclaw/clawhub/pull/53',
    mergedAt: '2026-02-13',
  },
  {
    project: 'OpenFront',
    repo: 'openfrontio/OpenFrontIO',
    about: 'A browser-based real-time strategy game.',
    change: 'Players who had already been eliminated were offered “Keep playing” on the win screen. They now get “Spectate”.',
    url: 'https://github.com/openfrontio/OpenFrontIO/pull/3062',
    mergedAt: '2026-02-06',
  },
  {
    project: 'Lichess API docs',
    repo: 'lichess-org/api',
    about: 'The OpenAPI specification behind the Lichess developer documentation.',
    change: 'Fixed internal links across 23 spec files so they work with the new documentation renderer.',
    url: 'https://github.com/lichess-org/api/pull/601',
    mergedAt: '2026-01-29',
  },
];

export const maintained: Maintained[] = [
  {
    name: 'ctx-memory',
    repo: 'GhadiSaab/ctx-memory',
    description: 'Local, persistent memory for AI coding agents. A session in Claude Code, Codex, Gemini CLI or OpenCode starts with what the last one learned.',
    tech: ['TypeScript', 'SQLite', 'MCP'],
  },
  {
    name: 'flux-homelab',
    repo: 'GhadiSaab/flux-homelab',
    description: 'The GitOps repository for my k3s homelab: everything the cluster runs, reconciled by Flux.',
    tech: ['Kubernetes', 'Flux', 'Kustomize'],
  },
  {
    name: 'Housy',
    repo: 'GhadiSaab/Housy',
    description: 'This website. Static Astro, built into a container, deployed to the homelab by CI.',
    tech: ['Astro', 'Docker', 'GitHub Actions'],
  },
];
