import inventory from './homelab.json';
const definitions = [
  { name: 'Applications', namespaces: ['portfolio', 'immich', 'jellyfin', 'adguard'], summary: 'Portfolio · Immich · Jellyfin · AdGuard' },
  { name: 'AI & tools', namespaces: ['open-webui', 'freellmapi', 'omni-agent', 'searxng', 'mcp-github', 'mcp-kubernetes'], summary: 'Open WebUI · FreeLLM · Omni Agent · SearXNG · MCP' },
  { name: 'Observability', namespaces: ['monitoring-ns', 'loki'], summary: 'Prometheus · Grafana · Loki · Alloy' },
  { name: 'GitOps & secrets', namespaces: ['flux-system'], summary: 'Flux controllers · Sealed Secrets' },
  { name: 'Cluster services', namespaces: ['kube-system', 'cert-manager', 'cnpg-system'], summary: 'Traefik · CoreDNS · cert-manager · CNPG' },
  { name: 'Edge connector', namespaces: ['cloudflared'], summary: 'Cloudflare Tunnel · two replicas' },
];
export const homelabGroups = definitions.map(group => {
  const workloads = inventory.workloads.filter(workload => group.namespaces.includes(workload.namespace));
  return { ...group, workloads, count: workloads.reduce((total, workload) => total + workload.containers.reduce((sum, container) => sum + container.replicas, 0), 0) };
});
export const containerCount = homelabGroups.reduce((total, group) => total + group.count, 0);
export const workloadCount = inventory.workloads.length;
export const capturedAt = inventory.capturedAt;
