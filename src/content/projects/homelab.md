---
title: A homelab, managed through Git
description: A k3s cluster, a GitOps workflow, and a place to explore how software runs.
technologies: [Kubernetes, Flux, Linux, Cloudflare]
featured: true
---

My homelab is a place to bring software engineering and infrastructure together.
It runs on **k3s**, with **Flux** reconciling the cluster from configuration in Git.

## The shape of the system

Git holds the desired state. Flux watches for changes and reconciles Kubernetes
resources. Applications run behind cluster services, and a Cloudflare Tunnel
connects selected services to public hostnames.

```text
Git repository
    │
    ▼
Flux reconciliation
    │
    ▼
k3s → application → cluster service
                         ▲
                         │
                Cloudflare Tunnel
                         ▲
                         │
                      Browser
```

## Why GitOps

I want infrastructure changes to have the same useful properties as code changes:
a diff to read, a history to follow, and a version to return to. Keeping the
desired state in Git makes those decisions visible.

The cluster's repository also validates its Kubernetes configuration with
Kustomize and schema checks. This puts feedback earlier in the change process.

## A deliberate trade-off

This is a single-node homelab. It gives me a manageable environment for running
services and experimenting with operational workflows. It also means the node
is a shared point of failure; multiple application replicas alone do not change
that constraint.

## What this project represents

The interesting part is the connection between an application and everything
around it: configuration, delivery, networking, and the ability to understand what
is running. This project is an evolving place to explore those connections.
