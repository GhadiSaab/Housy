---
title: My first field note
description: A draft example showing how to write a technical post in Markdown.
publishedAt: 2026-10-18
tags: [writing, infrastructure]
draft: true
---

HOUSY_PRIVATE_DRAFT_EXAMPLE

This draft is excluded from the public website. Replace the text, choose the
publication date, and set `draft: false` when the article is ready.

## Start with a question

Describe the problem, the constraints, and what you tried. Include the reasoning
behind a decision as well as the command you ran.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example
spec:
  selector:
    app: example
  ports:
    - port: 80
      targetPort: 8080
```

## Leave a trail

Write down what worked, what surprised you, and what you would change next time.

```sh
curl --fail --show-error --silent https://example.com/a-deliberately-long-path-to-demonstrate-how-code-blocks-scroll-on-small-screens
```
