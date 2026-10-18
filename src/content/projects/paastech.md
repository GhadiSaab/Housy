---
title: PaasTech, a small Heroku of our own
description: A self-hosted platform-as-a-service in Rust, built by four of us. My part was getting new versions live without dropping a request.
technologies: [Rust, Actix-web, PostgreSQL, Docker, Traefik]
featured: true
source: https://github.com/GhadiSaab/PaasTech
---

PaasTech is what you get when four people decide they'd rather deploy to their
own platform than to someone else's. You point the `paastech` CLI at an image,
and the platform runs it as a container, gives it a hostname, and watches over it.

## The shape of it

- **An API** in Rust (Actix-web) that owns the state of every project, app and
  process in PostgreSQL, and drives Docker directly through the Bollard client.
- **Traefik** in front, configured automatically for each deployed app, so a new
  app gets a route without anyone editing a proxy config.
- **Garage** for S3-compatible storage: one shared instance, one bucket per
  resource an app asks for.
- **A CLI** for everything a user does: deploy, update, inspect, manage resources.

I built the Traefik integration, the first version of the CLI, the database layer
the scheduler uses, and the part I want to talk about: updates.

## Updating without going dark

The naive way to ship a new version is to stop the old container and start the
new one. Users see errors for however long the new one takes to boot, and if it
never boots, the app is just down.

The update path I wrote does it in a safer order:

1. Start the new version as a **canary** container on a spare port, next to the
   old one, with the same environment.
2. Poll its `/health` endpoint every half second, for up to 15 seconds.
3. If it never answers, remove the canary and leave the old container serving
   traffic. The deploy reports itself as rolled back, nothing else changes.
4. If it's healthy, start the real replacement. For replicated apps, Traefik
   routes to both old and new for a short overlap, then the old one is removed.

The order is the whole point: nothing about the running version is touched until
the new one has proven it can answer a request. A bad image costs you a failed
deploy, not an outage.

## A bug worth keeping a test for

A teammate caught a regression in it. When the canary step went in, the
environment variables moved into the canary's setup, and the real production
container ended up started with only its port. Everything looked fine until an
app needed its configuration. The fix came with a test that checks both
containers get the full environment, so it can't quietly happen again. It's a
good reminder that "the deploy succeeded" and "the app works" are two different
checks.

## Where it runs

The team uses PaasTech to host its own deployments. Running your users' workloads
on something you wrote is a fast way to find out which parts you got wrong.
