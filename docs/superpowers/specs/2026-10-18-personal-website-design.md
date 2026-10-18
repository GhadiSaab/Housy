# Personal website design

## Purpose and agreed direction

Build Ghadi's portfolio and engineering blog for employers and fellow builders,
with a focus on software engineering, SRE, and infrastructure. Employers should
quickly understand the focus and find selected work; builders should be able to
read the reasoning behind projects and technical decisions.

The selected visual direction is the left-hand **Engineering field notes**
mockup: warm ivory, charcoal text, muted green accents, serif headings, clear
body typography, thin rules, generous spacing, and small infrastructure sketches.
The site address is `https://gsaab.dev`. The source repository is
`git@github.com:GhadiSaab/Housy.git`. Posts are Markdown files tracked in Git.

## Version-one experience

- `/`: compact navigation, introduction, selected work, recent writing, and
  GitHub/contact navigation. Use the mockup headline, “Software. Systems.
  Reliability.”, and the supporting line, “I build software and the infrastructure
  that keeps it running.”
- `/projects/`: selected project summaries, technology tags, and detail links.
- `/projects/[slug]/`: project context, architecture, decisions, trade-offs, and
  lessons, authored in Markdown.
- `/writing/`: published posts in descending publication-date order with dates,
  descriptions, and tags. Version one displays tags as metadata without tag pages.
- `/writing/[slug]/`: a readable article with a narrow text column, semantic
  headings, syntax-highlighted code, images, dates, and a return link.
- `/about/`: concise professional introduction and GitHub profile link.
- `/rss.xml`, `/sitemap-index.xml`, `/robots.txt`, and a designed 404 page.

On smaller screens the layout becomes one column and navigation remains visible
without requiring a menu script. Code blocks scroll within their container.
Include keyboard focus styles, a skip link, descriptive link text, and reduced
motion support. Decorative sketches are hidden from assistive technology.

## Content and identity

Start with the confirmed name **Ghadi**, the confirmed professional focus, and
`https://github.com/GhadiSaab`. Keep identity, biography, social links, and canonical
URL in one configuration file so they are easy to edit. The footer links to
GitHub; additional contact methods appear only when configured.

The first real project is a high-level description of the observed homelab:
k3s, Flux, GitOps, and Cloudflare Tunnel. Do not publish internal addresses,
credential references, or inventories of private services.

The older remote `~/portfolio` contains obvious sample employers, projects,
statistics, and placeholder identity fields. It is reference material only and
does not establish biographical facts. Do not migrate those claims.

Include a draft example post demonstrating Markdown and code blocks, and an
authoring template. Drafts are excluded from production article routes, indexes,
RSS, and the sitemap. If there are no published posts, show an intentional empty
state on the writing index and homepage rather than invented published articles.

## Application architecture

Use Astro with TypeScript, static output, and custom CSS. Keep the site primarily
HTML and CSS; the requested experience does not require a client framework,
database, authentication, or an application server.

Create separate build-time Markdown collections for `projects` and `posts`.
Post metadata includes title, description, publication date, optional update date,
tags, and draft status. Project metadata includes title, description, technology
tags, featured status, and optional verified external links. Use stable slugs
derived from filenames and validate metadata at build time.

Shared components cover the page shell, navigation, footer, project summaries,
article summaries, and decorative infrastructure artwork. Separate page layouts
handle general pages and long-form content. Centralize content filtering and
ordering so drafts cannot leak into feeds or alternate listings.

Use locally served fonts: a serif face for headings, a sans-serif face for body
text, and monospace for code and small labels. Draw the small infrastructure
sketches as native SVG to keep them sharp and lightweight. The generated comparison
image is a design reference, not an image to embed as the website.

## Build, publishing, and homelab deployment

Authoring flow: edit Markdown, preview locally, commit to Housy, then build a new
version. A push to the primary branch runs validation and builds a container image
in GitHub Actions. Publish the image to GHCR using the workflow's GitHub token,
tagged with the source commit; use the image digest for deployment.

Build Astro in a multi-stage container and serve the generated files with an
unprivileged static web server on port 8080. Use a single replica, health probes,
and modest resource requests. No persistent volume or Node.js runtime is needed
in the serving container. Serve the custom 404 page with a real HTTP 404 response.

Prepare a `portfolio/` Kustomize directory for the existing
`GhadiSaab/Gitops-homelab` repository, containing a Namespace, Deployment, Service,
and Kustomization. The Deployment pins the website image digest. Register the
directory in the root Kustomization, following the repository's existing layout.

Add a `gsaab.dev` rule to the existing Cloudflare Tunnel configuration before its
catch-all rule, targeting the website's ClusterIP Service. Update its existing
configuration checksum annotation so the tunnel pods reload configuration.
Traefik is not needed in this request path. Verify the root-domain DNS record
points to the tunnel before claiming the site is publicly available; existing
DNS records and API access have not been inspected.

The first version documents the image-digest update in the GitOps repository.
Automatic cross-repository deployment updates are deferred; Housy builds and
publishes images, while Flux deploys the version recorded in the GitOps repo.
Document package visibility: anonymous cluster pulls require a public GHCR image;
a private image requires an existing or newly configured image pull secret.

Prepare and validate the website and deployment changes before activating the
GitOps changes. Do not treat an image push as evidence of a successful deployment.
Keep the existing remote portfolio folder intact.

## Failure handling and verification

- Reject invalid Markdown metadata during the build with actionable file errors.
- Render useful empty states for collections with no published entries.
- Generate stable canonical URLs, page descriptions, RSS, and sitemap output
  from the configured production URL.
- Verify the production build, draft exclusion across every output surface,
  article and project links, and the static server's success and 404 responses.
- Inspect the rendered desktop and mobile pages, text wrapping, keyboard focus,
  code overflow, and visual alignment with the selected mockup.
- Build the deployment manifests with Kustomize and run the GitOps repository's
  applicable validation checks before any deployment.
- If deployment is performed, verify Flux reconciliation, workload readiness,
  internal HTTP responses, and public HTTPS at `https://gsaab.dev`.

## Explicit version-one boundaries

No comments, newsletter service, analytics, search, admin UI, dark-mode toggle,
or live homelab status dashboard. No invented employment history or achievement
statistics. Additional features can follow real content and usage.
