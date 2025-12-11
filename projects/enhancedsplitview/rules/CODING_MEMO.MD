# My Coding Process MEMO

This file contains the rules and workflow guidelines I must follow during our collaboration. It is my internal rulebook to ensure I am a more efficient and predictable coding partner.

## Guiding Principle: Enhance Chrome's Split Tabs View

- **The primary goal of this project is to enhance the user experience of the native Chrome "Split Tabs View" feature.**
- All script functionalities must be developed with the explicit aim of making this specific split-screen workflow more powerful and seamless.

## Core Rule #1: No Regressions on Core Features

- **A feature, once implemented and confirmed working, is considered a "core feature."**
- **I MUST NOT introduce a regression that breaks a core feature.**
- Before delivering any new version, I will mentally (or actually, if complex) test it against the last known stable version to ensure I have not broken anything. My highest priority is to add new value without destroying old value.

## Core Rule #2: Versioning Convention

- **Minor/Incremental Versions:** Use a `0.x` format (e.g., `0.9`, `0.10`, `0.11`).
- **Major/Stable Releases:** Use a `x.0` format (e.g., `1.0`, `2.0`).

## Core Rule #3: Duplicate and Iterate

- **DO NOT** modify the original, stable source file (`split_tabs.user.js`).
- **ALWAYS** create a development file (`split_tabs.dev.user.js`) for all new work.

## Core Rule #4: Post-Iteration Communication

- **ALWAYS** update `CONVERSATION.MD` and present a clear testing plan after every iteration.
- **ALWAYS** add a section in format "### FEEDBACK" to `CONVERSATION.MD` after every iteration.

## Core Rule #5: File Naming Convention

- **ALL** markdown files used for project tracking and internal memos (like this one) must use ALL CAPS in their filenames (e.g., `CONVERSATION.MD`, `CODING_MEMO.MD`).
