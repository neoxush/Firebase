# Repository and Project Structure Guide

This document outlines the structure of the `Firebase` repository and the conventions to follow when creating new projects. Adhering to these guidelines ensures a clean, organized, and scalable monorepo.

## Directory Structure

The repository is organized as follows:

```
Firebase/
├── projects/
│   ├── project-one/
│   │   ├── node_modules/
│   │   ├── src/
│   │   ├── package.json
│   │   └── ... (other project-specific files)
│   └── project-two/
│       ├── node_modules/
│       ├── src/
│       ├── package.json
│       └── ... (other project-specific files)
├── .gitignore
├── PROJECT_STRUCTURE.md
└── README.md
```

- **`projects/`**: This directory contains all individual Firebase projects.
- **`projects/<project-name>/`**: Each project has its own dedicated folder within the `projects` directory.

## Creating a New Project

To add a new project to this repository, follow these steps:

1.  **Create a New Project Folder:**
    -   Inside the `projects` directory, create a new folder for your project.
    -   **Naming Convention:** The folder name should be in `kebab-case` (e.g., `my-new-app`, `user-authentication-service`).

2.  **Initialize Your Project:**
    -   Navigate into your new project folder:
        ```bash
        cd projects/<project-name>
        ```
    -   Initialize your project (e.g., using `npm init`, `npx create-react-app`, etc.).

3.  **Dependency Management:**
    -   All dependencies for a project **must** be managed within that project's folder.
    -   Run `npm install <package-name>` inside your project's directory. This will create a `node_modules` folder and `package-lock.json` file specific to your project.
    -   **Do not** run `npm install` at the root of the `Firebase` repository.

## Golden Rules

1.  **Isolate Projects:** Each project must be self-contained within its own folder in the `projects` directory.
2.  **Isolate Dependencies:** Each project must have its own `node_modules` directory. There should be no `node_modules` folder at the root of the repository.
3.  **Follow Naming Conventions:** Use `kebab-case` for all project folder names.
4.  **Update this Guide:** If you need to change the structure, update this document to reflect the changes.

By following these rules, we can maintain a clean and manageable repository as we add more Firebase projects.
