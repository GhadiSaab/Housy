---
title: Barenetes, Kubernetes rebuilt in Rust
description: A team effort to reimplement the core of the Kubernetes control plane from scratch. I worked on how the scheduler sees the cluster.
technologies: [Rust, gRPC, Protobuf, mTLS]
featured: true
source: https://github.com/do-2k25-28/Barenetes
---

Kubernetes does a lot for you, which also makes it hard to see into. Barenetes is our attempt to
understand it by building the smallest version that still works: an open-source
Cargo workspace where each crate stands in for a real Kubernetes component.
Sixteen people have contributed so far.

| Crate | Plays the part of | Job |
| --- | --- | --- |
| `api` | kube-apiserver | Holds cluster state and coordinates everyone else |
| `scheduler` | kube-scheduler | Decides which node a pod runs on |
| `agent` | kubelet | Runs on each node and manages containers |
| `cni` | CNI plugin | Pod networking |
| `barectl` | kubectl | The command-line client |
| `pki` | (none) | Bootstraps the cluster's own certificate authority |

Every component talks to the others over gRPC, and every connection uses mutual
TLS. The project is early and not meant for production. The point is to make each
piece small enough to read.

## Turning the scheduler into a watcher

When I picked up the scheduler, it was a gRPC server that waited for someone to
ask "where should this pod go?" and answered from a hardcoded list of fake nodes.
That clashed with the API design the team had already agreed on, where the
scheduler is a client: it subscribes to streams of node and pod changes and
reports its decisions back.

I rewrote it around that model ([#82](https://github.com/do-2k25-28/Barenetes/pull/82)).
The scheduler now runs two watch loops against the API server, one for nodes and
one for pods, sharing a single view of the cluster. New pending pods are placed as
they arrive. Pods that couldn't be placed go into a pending set, and every node
event retries them, because a node joining, gaining capacity or recovering is
exactly what can make an unplaceable pod placeable. The placement rule itself
stayed the same: the least-loaded ready node that still has room for the pod's
resource limits and its host ports.

## The pod that waited forever

That design had a hole, which showed up once the scheduler could restart
independently of the API server. Watch streams only delivered changes from the
moment you subscribed. A pod created before the scheduler connected had already
fired its single "added" event into the void. The scheduler never saw it, and it
sat in `Pending` forever with no error anywhere.

The fix ([#95](https://github.com/do-2k25-28/Barenetes/pull/95)) gives those
streams the same semantics Kubernetes informers rely on: snapshot the current
state, subscribe, then replay the snapshot in front of the live events. A client
can't tell "existed before I connected" from "created just after". In the
in-memory store, the snapshot and the subscription happen under the same lock,
so a change lands in exactly one of them, never both and never neither. I tested
it the honest way: start the API server, register a node, create a pod, and only
then start the scheduler. Before the fix the pod stayed stuck. After it, the pod
was placed the moment the scheduler connected.

## The less glamorous parts

I also made the scheduler survive failed assignments and propagate watcher errors
instead of dying quietly, set up the lint and test workflow in CI, and worked on
`barectl`: shell completions, short aliases, showing pod and node addresses in
list views, and packaging it as `.deb`, `.rpm` and pacman packages so it installs
like any other tool.

## What I took from it

Most of the interesting bugs weren't in the placement maths. They were in the
seams between components: who calls whom, what a subscriber sees when it joins
late, what happens when one side restarts. That's exactly the part Kubernetes
hides from you, and the part worth rebuilding yourself.
