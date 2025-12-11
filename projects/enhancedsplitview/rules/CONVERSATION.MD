# Project Conversation: Split Tab Manager

This file tracks the development progress, improvements, and user feedback for the "Split Tab Manager" Tampermonkey script.

---

## Version 0.20

### USER-LED UPDATE

The user has manually implemented version `0.20`, introducing significant new features and resolving a long-standing UI bug with a new design paradigm.

### KEY FEATURES & IMPROVEMENTS

1.  **Configuration Panel:** A new UI panel allows users to customize the mouse and keyboard combinations for setting 'Source' and 'Target' tabs.
2.  **New UI/UX:** The status indicator dot has been redesigned as a side-hugging tab.
3.  **UI Positioning Bug FIXED:** The UI now positions itself based on the tab's **role** (Source on right, Target on left), which elegantly solves the old positioning bug.

### ARCHIVED: Previous Development Cycle (v0.18.x)

The previous attempts to fix the UI bug (`v0.18.1` - `v0.18.3`) have been superseded by the superior logic in `v0.20`. These versions are archived for historical reference.

---

## Version 0.20.1

### USER FEEDBACK (v0.20.0)
- The user identified a critical logic flaw: When a tab is set as 'Source', any new tab opened from it (e.g., via middle-click) automatically inherits the role. This is unintended behavior. New tabs should start as 'idle'.

### ANALYSIS OF FLAW
- The root cause is `window.name` inheritance. A new tab inherits the `window.name` property of its opener.
- The `loadState` function in `v0.20.0` preferentially read from `window.name`, causing the new tab to wrongly adopt its parent's role.

### ACTION PLAN & RESOLUTION
- The `loadState` function was changed to prioritize `sessionStorage` for loading state.
- If `sessionStorage` is empty (indicating a new tab session), the function now ignores any state found in `window.name` and defaults to an 'idle' state.
- This change was confirmed by the user to fix the flaw.

### FEEDBACK
- I think we could look into dragging feature, I found a reason why dependent tabs outside split tabs view will be accidently marked as TARGET is highly related with user chose dragging to create TARGET label for splitted tab, somehow it past through to other windows randomly. To compare with it, I use shortcut to create a TARGET and found that's not creating a TARGET on the rest tab

---

## Version 0.21 (Current)

### USER FEEDBACK (v0.20.1)
- The user discovered a major bug where using the drag-to-pair feature would incorrectly assign the 'Target' role to multiple background tabs across different windows, not just the intended tab.

### ANALYSIS OF FLAW
- The drag-to-pair action was broadcasting a global `GM_setValue` request.
- Every single `idle` tab running the script was listening for this request and attempting to become a `Target` simultaneously, creating a race condition.
- This resulted in the 'Target' role being assigned randomly to any tab that was open, not just the one the user was looking at.

### ACTION PLAN & RESOLUTION
- A condition (`!document.hidden`) has been added to the `GM_addValueChangeListener` for the `KEY_DRAG_PAIR_REQUEST`.
- This ensures that only the currently active, visible tab can accept the pairing request.
- This change prevents the bug by making sure background or non-visible tabs ignore the broadcast, ensuring only the intended tab is paired.

### TESTING PLAN

**Objective:** Confirm that the drag-to-pair feature now *only* assigns the Target role to the currently active and visible tab, and does not affect any background tabs.

**1. Setup the Test Environment:**
    *   Open **two separate browser windows**.
    *   In Window 1, open a webpage that will be your **Source**.
    *   In Window 2, open two separate tabs. Both should be `idle`.

**2. Test the Fix:**
    *   In Window 1, set the tab as the **Source** (e.g., `Ctrl + Middle-click`). The 'S' icon should appear.
    *   Click and drag the 'S' icon. While still holding the mouse button, move your mouse cursor over to Window 2.
    *   In Window 2, select one of the idle tabs so it becomes the active, visible tab.
    *   **Crucially, release the mouse button over this active tab.**

**3. Verify the Result:**
    *   **Expected Result:** The active tab in Window 2 where you released the mouse should become the **Target** (the 'T' icon will appear).
    *   **Expected Result:** The *other*, non-active tab in Window 2 must remain **`idle`**. The UI should not appear on it.
    *   **Failure Condition:** If the non-active tab in Window 2 also becomes a Target, the fix is not working.

### FEEDBACK
- failed to receive a proper result, should do an in-depth research on our paring method ESPCIALLY through dragging feature to setup a connection
- my hunch is that since we are communicating from UI element to our own transimitting pair session, we don't lock on which split tabs view is and more IMPORTANT is we don't know which two tabs are included
- is there any Chrome native window id we could use to identify more specificly about window?