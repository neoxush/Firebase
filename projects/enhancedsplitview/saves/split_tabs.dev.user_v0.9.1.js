// ==UserScript==
// @name         Split Tab Manager (Dev)
// @namespace    http://tampermonkey.net/
// @version      0.9.1
// @description  Hotfix for UI positioning during role swap.
// @author       You
// @match        *://*/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

(function () {
    'use strict';

    console.log('Split Tab (Dev): Script initialized (v0.9.1)');

    // --- Configuration & Keys (v0.9.1) ---
    const STATE_PREFIX = 'SPLIT_TAB_STATE_V9.1=';
    const SESSION_KEY_ROLE = 'split_tab_role_v9.1';
    const SESSION_KEY_ID = 'split_tab_id_v9.1';
    const SESSION_KEY_POSITION = 'split_tab_position_v9.1'; // NEW

    const KEY_LATEST_SOURCE = 'split_tab_latest_source_v9.1';
    const getTargetUrlKey = (id) => `split_tab_url_v9.1_${id}`;
    const getTimestampKey = (id) => `split_tab_ts_v9.1_${id}`;
    const getSwapKey = (id) => `split_tab_swap_v9.1_${id}`;

    // --- State Management ---
    let myRole = 'idle';
    let myId = null;
    let myPosition = null; // NEW: 'left-pane' or 'right-pane'
    let ui = null;
    let listenersAttached = false;

    function saveState(role, id, position) {
        myRole = role;
        myId = id;
        myPosition = position;

        if (role === 'idle') {
            sessionStorage.removeItem(SESSION_KEY_ROLE);
            sessionStorage.removeItem(SESSION_KEY_ID);
            sessionStorage.removeItem(SESSION_KEY_POSITION);
            window.name = '';
        } else {
            sessionStorage.setItem(SESSION_KEY_ROLE, role);
            sessionStorage.setItem(SESSION_KEY_ID, id);
            sessionStorage.setItem(SESSION_KEY_POSITION, position);
            window.name = STATE_PREFIX + JSON.stringify({ role, id, position });
        }

        updateUI();
        attachUniversalListeners();
    }

    function loadState() {
        const role = sessionStorage.getItem(SESSION_KEY_ROLE) || 'idle';
        const id = sessionStorage.getItem(SESSION_KEY_ID) || null;
        const position = sessionStorage.getItem(SESSION_KEY_POSITION) || null;
        return { role, id, position };
    }

    // --- UI (v0.9.1) ---
    function injectStyles() {
        GM_addStyle(`
            /* ... animations from v0.9 ... */
            @keyframes stm-pulse { 0% {transform: scale(1);} 70% {transform: scale(1.3);} 100% {transform: scale(1);} }
            .stm-pulse-animate { animation: stm-pulse 0.7s ease-out; }

            #stm-ui-container { position: fixed; top: 15px; z-index: 2147483647; user-select: none; }
            /* POSITIONING IS NOW BASED ON PANE, NOT ROLE */
            #stm-ui-container.left-pane { right: 15px; }
            #stm-ui-container.right-pane { left: 15px; }

            #stm-status-dot {
                width: 22px; height: 22px; border-radius: 50%;
                box-shadow: 0 3px 10px rgba(0,0,0,0.4); cursor: pointer;
                transition: transform 0.2s, background-color 0.3s; border: 2px solid white;
                display: flex; align-items: center; justify-content: center;
                font-family: sans-serif; font-size: 14px; font-weight: bold; color: white;
            }
            #stm-status-dot:hover { transform: scale(1.15); }
            /* COLOR & SYMBOL ARE BASED ON ROLE */
            #stm-status-dot.source { background-color: #28a745; } /* Green */
            #stm-status-dot.target { background-color: #007bff; } /* Blue */
            #stm-status-dot.failure { background-color: #dc3545; } /* Red */

            #stm-menu { position: absolute; top: 120%; background-color: #333; border-radius: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); overflow: hidden; width: 150px; display: none; }
            #stm-ui-container.left-pane #stm-menu { right: 0; }
            #stm-ui-container.right-pane #stm-menu { left: 0; }

            .stm-menu-item { padding: 10px 15px; color: #fff; cursor: pointer; transition: background-color 0.2s; }
        `);
    }

    function updateUI() {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', updateUI, { once: true }); return;
        }
        if (!document.body) return;

        if (!ui) {
             ui = {};
            ui.container = document.createElement('div'); ui.container.id = 'stm-ui-container';
            ui.dot = document.createElement('div'); ui.dot.id = 'stm-status-dot';
            ui.menu = document.createElement('div'); ui.menu.id = 'stm-menu';
            ui.container.append(ui.menu, ui.dot);
            document.body.appendChild(ui.container);
            ui.dot.addEventListener('click', toggleMenu);
            ui.menu.addEventListener('click', handleMenuClick);
        }

        // Set classes: POSITION class on container, ROLE class on dot
        ui.container.className = myPosition;
        ui.dot.className = myRole;

        ui.dot.textContent = myRole === 'source' ? 'S' : myRole === 'target' ? 'T' : '';
        ui.container.style.display = (myRole === 'idle') ? 'none' : 'block';

        if (myRole !== 'idle' && !ui.menu.innerHTML) {
             ui.menu.innerHTML = `<div class="stm-menu-item" data-action="swap">Swap Roles</div><div class="stm-menu-item" data-action="disconnect">Disconnect</div>`;
        } else if (myRole === 'idle') {
            ui.menu.innerHTML = '';
        }
    }

    function toggleMenu() { if(ui && ui.menu) ui.menu.style.display = (ui.menu.style.display === 'none') ? 'block' : 'none'; }
    function pulseDot() { if(ui && ui.dot) { ui.dot.classList.add('stm-pulse-animate'); ui.dot.addEventListener('animationend', () => ui.dot.classList.remove('stm-pulse-animate'), { once: true }); } }

    // --- Core Logic (v0.9.1) ---
    function generateId() { return Math.random().toString(36).substr(2, 9); }

    function setAsSource() {
        const newId = myId || generateId();
        // This is a NEW SOURCE, so we assume it's the LEFT PANE.
        saveState('source', newId, 'left-pane');
        GM_setValue(KEY_LATEST_SOURCE, { sourceId: newId, timestamp: Date.now() });
    }

    function setAsTarget() {
        const latestSource = GM_getValue(KEY_LATEST_SOURCE, null);
        if (latestSource && latestSource.sourceId) {
            // This is a NEW TARGET, so we assume it's the RIGHT PANE.
            saveState('target', latestSource.sourceId, 'right-pane');
        } else {
            // Handle failure...
            GM_notification({ text: 'Could not find a SOURCE tab to pair with.', title: 'Split Tab Error', timeout: 4000 });
        }
    }

    function swapRoles() {
        if (!myId) return;
        GM_setValue(getSwapKey(myId), { timestamp: Date.now() });
        performSwap();
    }

    function performSwap() {
        // The key fix: The POSITION does NOT change, only the ROLE.
        const newRole = myRole === 'source' ? 'target' : 'source';
        saveState(newRole, myId, myPosition);
        // If we just became a source, we must announce it
        if (newRole === 'source') {
            GM_setValue(KEY_LATEST_SOURCE, { sourceId: myId, timestamp: Date.now() });
        }
    }

    function disconnect() {
        saveState('idle', null, null);
    }

    // --- Event Handlers ---
    function handleLinkClick(e) {
        if (myRole !== 'source') return;
        const link = e.target.closest('a[href]');
        if (!link || link.href.startsWith('javascript:') || link.href.startsWith('#')) return;

        e.preventDefault();
        e.stopPropagation();

        GM_setValue(getTargetUrlKey(myId), link.href);
        GM_setValue(getTimestampKey(myId), Date.now());
        pulseDot();
    }

    function handleMenuClick(e) {
        const action = e.target.dataset.action;
        if (!action) return;
        if (action === 'swap') swapRoles();
        if (action === 'disconnect') disconnect();
        toggleMenu();
    }

    // --- Listeners ---
    function attachUniversalListeners() {
        if (listenersAttached && myRole !== 'idle') return;
        if (myRole === 'idle') {
             listenersAttached = false;
             return;
        }
        listenersAttached = true;

        GM_addValueChangeListener(getTimestampKey(myId), (key, oldVal, newVal, remote) => {
            if (remote && myRole === 'target') {
                const url = GM_getValue(getTargetUrlKey(myId));
                if (url) { pulseDot(); window.location.href = url; }
            }
        });

        GM_addValueChangeListener(getSwapKey(myId), (key, oldVal, newVal, remote) => {
             if (remote) performSwap();
        });
    }

    // --- Initialization ---
    function initialize() {
        injectStyles();
        const { role, id, position } = loadState();
        saveState(role, id, position);

        window.addEventListener('click', handleLinkClick, true);

        GM_registerMenuCommand("STM (Dev): Set as SOURCE", setAsSource);
        GM_registerMenuCommand("STM (Dev): Set as TARGET", setAsTarget);
        GM_registerMenuCommand("STM (Dev): Disconnect", disconnect);
    }

    initialize();

})();
