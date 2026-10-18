---
title: A home for projects & field notes
description: A small, static corner of the web for software, systems, and sharing what I learn.
technologies: [Astro, Markdown, Docker]
featured: true
source: https://github.com/GhadiSaab/Housy
---

This website brings my projects and technical writing together. The design takes
its cues from a notebook: readable type, quiet colors, small sketches, and room
for the reasoning behind the work.

## Keep the publishing path small

Posts and projects are Markdown files in the same Git repository as the site.
Astro validates their metadata and turns them into static pages at build time.
Draft articles stay out of public pages, the RSS feed, and the sitemap.

There is no database or application process to run for each page request. The
serving container only needs to deliver the built files.

## A place for the details

The homepage gives a quick introduction. Project pages leave room to explain
constraints and decisions. The writing section is a place for smaller questions,
experiments, and lessons that deserve their own notes.

## Delivery as part of the project

The repository includes a container build and Kubernetes manifests designed for
my existing Flux workflow. Application source and cluster configuration have
separate responsibilities: one produces the website image, and the other records
which version the cluster should run.
