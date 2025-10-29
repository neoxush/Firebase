
# Typing Feast: Specification-Driven Development (SDD)

This document outlines the vision, architecture, and development guidelines for the "Typing Feast" game. It serves as the central "spec" to guide all development and ensure a consistent, high-quality, and scalable product.

## 1. Persona

You are an expert developer proficient in both front- and back-end development with a deep understanding of TypeScript, modern web frameworks (like React or Vue), and CSS. You create clear, concise, documented, and readable code.

You are very experienced with Google Cloud and Firebase services and know how to integrate them effectively to build scalable, real-time applications.

## 2. Core Gameplay Mechanics (Specification)

This section defines the core features and gameplay loops. All development should align with this specification.

### 2.1. Game Modes

- **Word Rain (Classic):**
  - Words fall from the top of the screen.
  - The player must type the highlighted word to clear it.
  - If a word reaches the bottom, the player loses a life.
  - The game ends when the player runs out of lives.

- **Timed Challenge (Future):**
  - The player has a fixed amount of time (e.g., 60 seconds) to correctly type as many words as possible.
  - Words appear one after another.

- **Survival Mode (Future):**
  - An endless stream of words, similar to Word Rain.
  - The speed of falling words gradually increases over time.
  - The game ends when the player is overwhelmed.

### 2.2. Scoring System

- **Base Points:** 10 points for each correctly typed word.
- **Accuracy Bonus:** (Accuracy %) * 10. For example, 95% accuracy gives an extra 9.5 points.
- **Speed Bonus (WPM):** (WPM / 10). For example, a WPM of 60 gives an extra 6 points.
- **Combo Bonus:** +5 points for every 5 consecutive words typed without a mistake.

### 2.3. Player Progression

- **Experience Points (XP):** Players earn XP equivalent to their final score for each game played.
- **Levels:** A player levels up based on accumulated XP.
- **Achievements:** Unlockable badges for reaching certain milestones (e.g., "Word Wizard" for reaching a 100 WPM, "Perfecto" for a 100% accuracy game).

## 3. Technical Architecture

### 3.1. Frontend

- **Language:** TypeScript
- **Framework:** (To be decided: React, Vue, or Svelte for a more robust UI)
- **Styling:** Tailwind CSS for utility-first styling.

### 3.2. Backend (Firebase)

- **Authentication:** Firebase Authentication for user accounts (Email/Password and Google Sign-In).
- **Database:** Firestore to store user data, game sessions, and leaderboards.
- **Serverless Functions:** Cloud Functions for Firebase for all server-side logic.

## 4. Data Models (Firestore Specification)

This section defines the structure of our Firestore database. This is the "source of truth" for all data.

- **`users` (Collection)**
  - **`{userId}` (Document)**
    - `email`: (String) User's email.
    - `displayName`: (String) User's display name.
    - `level`: (Number) Current player level.
    - `xp`: (Number) Total accumulated experience points.
    - `achievements`: (Array<String>) List of unlocked achievement IDs.
    - `createdAt`: (Timestamp)

- **`gameSessions` (Collection)**
  - **`{sessionId}` (Document)**
    - `userId`: (String) Foreign key to the `users` collection.
    - `gameMode`: (String) "word-rain", "timed-challenge", etc.
    - `score`: (Number) Final score for the session.
    - `wpm`: (Number) Words per minute.
    - `accuracy`: (Number) Typing accuracy percentage.
    - `datePlayed`: (Timestamp)

- **`leaderboards` (Collection)**
  - **`daily` (Document)**
    - `scores`: (Array<Object>) List of top scores for the day.
      - `userId`: (String)
      - `displayName`: (String)
      - `score`: (Number)
  - **`weekly` (Document)**
    - (Same structure as `daily`)
  - **`all-time` (Document)**
    - (Same structure as `daily`)

## 5. API Contract (Cloud Functions Specification)

This defines the server-side logic to be implemented as Cloud Functions.

- **`onFinalizeGameSession` (Firestore Trigger)**
  - **Trigger:** On create of a new document in `gameSessions`.
  - **Action:**
    1. Reads the `score` from the new `gameSession`.
    2. Updates the corresponding user's `xp` and `level` in the `users` collection.
    3. Checks if the score qualifies for any leaderboards and updates the `leaderboards` collection.

- **`getLeaderboard` (HTTP Trigger)**
  - **Endpoint:** `GET /leaderboard?period={daily|weekly|all-time}`
  - **Request:** Query parameter for the leaderboard period.
  - **Response:** A JSON object containing the top scores for the requested period.

## 6. Development and Coding Guidelines

### 6.1. Code Organization

- **Feature-Based Structure:** Organize code by features (e.g., `authentication`, `game-modes`, `leaderboards`).
- **Separation of Concerns:** Keep UI, business logic, and data access separate.
- **Consistent Naming:** Follow standard TypeScript/JavaScript naming conventions.

### 6.2. Testing

- **Unit Tests (Jest/Vitest):** For individual functions, UI components, and game logic.
- **Integration Tests (Firebase Emulators):** For testing Cloud Functions and Security Rules interactions.
- **End-to-End Tests (Cypress/Playwright):** For critical user flows like signing up, playing a full game, and viewing leaderboards.

### 6.3. UI/UX Principles

- **Responsive Design:** The game must be playable on all screen sizes.
- **Loading States:** Use skeleton screens or spinners when loading data.
- **Animations:** Use subtle animations for a polished and engaging feel.
- **Accessibility:** Ensure the game is playable for users with disabilities (e.g., keyboard navigation, screen reader support).
