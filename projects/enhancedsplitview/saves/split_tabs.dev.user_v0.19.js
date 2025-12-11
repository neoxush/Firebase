// ==UserScript==
// @name         Split Tab Manager (Dev)
// @namespace    http://tampermonkey.net/
// @version      0.19
// @description  Rollback to stable baseline. Core logic is functional; UI placement fixed for split view.
// @author       You
// @match        *://*/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

(function () {
    'use strict';

    console.log('Split Tab (Dev): Script initialized (v0.19 UI Fix)');

    // --- Configuration & Keys ---
    const STATE_PREFIX = 'STM_STATE_V18=';
    const SESSION_KEY_ROLE = 'stm_role_v18';
    const SESSION_KEY_ID = 'stm_id_v18';

    const GM_PREFIX = 'stm_gm_v18_';
    const KEY_LATEST_SOURCE = `${GM_PREFIX}latest_source`;
    const KEY_DRAG_PAIR_REQUEST = `${GM_PREFIX}drag_pair_request`;
    const getTargetUrlKey = (id) => `${GM_PREFIX}url_${id}`;
    const getTimestampKey = (id) => `${GM_PREFIX}ts_${id}`;
    const getDisconnectKey = (id) => `${GM_PREFIX}disconnect_${id}`;

    // --- State Management ---
    let myRole = 'idle';
    let myId = null;
    let ui = null;
    let activeListeners = [];

    function saveState(role, id) {
        myRole = role; myId = id;
        if (role === 'idle') {
            [SESSION_KEY_ROLE, SESSION_KEY_ID].forEach(k => sessionStorage.removeItem(k));
            if (window.name.startsWith(STATE_PREFIX)) window.name = '';
        } else {
            sessionStorage.setItem(SESSION_KEY_ROLE, role);
            sessionStorage.setItem(SESSION_KEY_ID, id);
            window.name = STATE_PREFIX + JSON.stringify({ role, id });
        }
        updateUI();
        attachRoleSpecificListeners();
    }

    function loadState() {
        if (window.name.startsWith(STATE_PREFIX)) {
            try { return JSON.parse(window.name.substring(STATE_PREFIX.length)); } catch (e) { /* fall through */ }
        }
        return { role: sessionStorage.getItem(SESSION_KEY_ROLE) || 'idle', id: sessionStorage.getItem(SESSION_KEY_ID) || null };
    }

    // --- UI Logic ---
    function injectStyles() {
        GM_addStyle(`
            @keyframes stm-pulse { 0% {transform: scale(1);} 50% {transform: scale(1.2);} 100% {transform: scale(1);} }
            .stm-pulse-animate { animation: stm-pulse 0.5s ease-out; }

            /* Main Container - hugs the edge */
            #stm-ui-container {
                position: fixed;
                top: 85px; /* Position down the side slightly */
                z-index: 2147483647;
                user-select: none;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Placement Logic:
               Target (Right Window) -> UI on Left Edge
               Source (Left Window)  -> UI on Right Edge
            */
            #stm-ui-container.stm-side-right { right: 0; }
            #stm-ui-container.stm-side-left { left: 0; }

            /* The Dot / Tab */
            #stm-status-dot {
                width: 100%;
                height: 100%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: sans-serif;
                font-size: 14px;
                font-weight: bold;
                color: white;
                cursor: grab;
                transition: transform 0.2s, background-color 0.3s;
                border: 1px solid rgba(255,255,255,0.5);
            }
            #stm-status-dot:active { cursor: grabbing; }

            /* Source Style (Green, Right Edge, Rounded Left corners) */
            #stm-ui-container.stm-side-right #stm-status-dot {
                background-color: #28a745;
                border-radius: 8px 0 0 8px; /* Tab look */
                border-right: none;
            }

            /* Target Style (Blue, Left Edge, Rounded Right corners) */
            #stm-ui-container.stm-side-left #stm-status-dot {
                background-color: #007bff;
                border-radius: 0 8px 8px 0; /* Tab look */
                border-left: none;
            }

            /* Hover Effects */
            #stm-ui-container.stm-side-right:hover #stm-status-dot { transform: translateX(-3px); }
            #stm-ui-container.stm-side-left:hover #stm-status-dot { transform: translateX(3px); }

            /* Context Menu */
            #stm-menu {
                display: none;
                position: absolute;
                top: 100%;
                background-color: #333;
                border-radius: 4px;
                width: 120px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                font-family: sans-serif;
                font-size: 12px;
            }
            /* Menu alignment to prevent cutoff */
            #stm-ui-container.stm-side-right #stm-menu { right: 0; border-top-right-radius: 0; }
            #stm-ui-container.stm-side-left #stm-menu { left: 0; border-top-left-radius: 0; }

            .stm-menu-item { padding: 8px 12px; color: #fff; cursor: pointer; transition: background-color 0.2s; }
            .stm-menu-item:hover { background-color: #555; }
        `);
    }

    function updateUI() {
        if (!document.body) { window.addEventListener('DOMContentLoaded', updateUI, { once: true }); return; }
        if (!ui) {
            ui = { container: document.createElement('div'), dot: document.createElement('div'), menu: document.createElement('div') };
            ui.container.id = 'stm-ui-container';
            ui.dot.id = 'stm-status-dot';
            ui.menu.id = 'stm-menu';
            ui.container.append(ui.menu, ui.dot);
            document.body.appendChild(ui.container);

            ui.dot.addEventListener('mousedown', handleDragStart);
            ui.menu.addEventListener('click', handleMenuClick);
            // Close menu when clicking outside
            window.addEventListener('click', (e) => {
                if (ui && ui.menu.style.display === 'block' && !ui.container.contains(e.target)) toggleMenu();
            }, true);
        }

        // --- Logic Fix: Position based on Role ---
        // If I am Source, I assume I am the left window -> Place UI on Right Edge
        // If I am Target, I assume I am the right window -> Place UI on Left Edge
        // If I am Idle, I hide.
        ui.container.style.display = (myRole === 'idle') ? 'none' : 'flex';

        // Reset classes
        ui.container.classList.remove('stm-side-left', 'stm-side-right');

        if (myRole === 'source') {
            ui.container.classList.add('stm-side-right');
            ui.dot.textContent = 'S';
        } else if (myRole === 'target') {
            ui.container.classList.add('stm-side-left');
            ui.dot.textContent = 'T';
        }

        if (myRole !== 'idle') {
            ui.menu.innerHTML = `<div class="stm-menu-item" data-action="disconnect">Disconnect</div>`;
        }
    }

    function toggleMenu() { if(ui && ui.menu) ui.menu.style.display = ui.menu.style.display === 'block' ? 'none' : 'block'; }
    function pulseDot() { if(ui && ui.dot) { ui.dot.classList.add('stm-pulse-animate'); ui.dot.addEventListener('animationend', () => ui.dot.classList.remove('stm-pulse-animate'), { once: true }); } }

    // --- Core Logic ---
    const generateId = () => Math.random().toString(36).substr(2, 9);
    function setRole(role, id = null) {
        if (role === 'source') {
            const newId = id || generateId();
            saveState('source', newId);
            GM_setValue(KEY_LATEST_SOURCE, { sourceId: newId, timestamp: Date.now() });
        } else if (role === 'target') {
            if (!id) { GM_notification({ text: 'Cannot become Target without a Source ID.'}); return; }
            saveState('target', id);
        }
    }
    function broadcastDisconnect() { if (myId) { GM_setValue(getDisconnectKey(myId), Date.now()); saveState('idle', null); } }

    // --- Event Handlers ---
    let dragState = {};
    function handleDragStart(e) {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        dragState = { isClick: true, startX: e.clientX, startY: e.clientY };
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd, { once: true });
    }
    function handleDragMove(e) {
        // Threshold to detect drag vs click
        if (dragState.isClick && (Math.abs(e.clientX - dragState.startX) > 5 || Math.abs(e.clientY - dragState.startY) > 5)) {
            dragState.isClick = false;
        }
        if (myRole === 'source') { ui.dot.style.cursor = 'grabbing'; }
    }
    function handleDragEnd(e) {
        window.removeEventListener('mousemove', handleDragMove);
        if (dragState.isClick) {
            toggleMenu();
        } else if (myRole === 'source') {
            // Logic: Drop event
            GM_setValue(KEY_DRAG_PAIR_REQUEST, { sourceId: myId, timestamp: Date.now() });
        }
        ui.dot.style.cursor = 'grab';
        dragState = {};
    }
    function handleMenuClick(e) { const action = e.target.dataset.action; if (!action) return; if (action === 'disconnect') broadcastDisconnect(); toggleMenu(); }
    function handleLinkClick(e) {
        if (myRole !== 'source') return;
        const link = e.target.closest('a[href]');
        if (!link || link.href.startsWith('javascript:') || link.href.startsWith('#')) return;
        e.preventDefault(); e.stopPropagation();
        GM_setValue(getTargetUrlKey(myId), link.href);
        GM_setValue(getTimestampKey(myId), Date.now());
        pulseDot();
    }

    // --- Listeners ---
    function attachRoleSpecificListeners() {
        activeListeners.forEach(listenerId => GM_removeValueChangeListener(listenerId));
        activeListeners = [];
        if (myRole === 'idle' || !myId) return;
        const disconnectListener = GM_addValueChangeListener(getDisconnectKey(myId), (k, o, n, r) => { if (r) saveState('idle', null); });
        activeListeners.push(disconnectListener);
        if (myRole === 'target') {
            const urlListener = GM_addValueChangeListener(getTimestampKey(myId), (k, o, n, r) => { if (r) { pulseDot(); window.location.href = GM_getValue(getTargetUrlKey(myId)); } });
            activeListeners.push(urlListener);
        }
    }

    function initialize() {
        GM_addValueChangeListener(KEY_DRAG_PAIR_REQUEST, (key, oldVal, newVal, remote) => { if (remote && myRole === 'idle') { setRole('target', newVal.sourceId); } });
        const s = loadState();
        injectStyles();
        saveState(s.role, s.id);
        window.addEventListener('click', handleLinkClick, true);
        GM_registerMenuCommand("STM (Dev): Disconnect", broadcastDisconnect);
        window.addEventListener('mousedown', (e) => {
            if (e.button !== 1 || (!e.ctrlKey && !e.altKey)) return;
            e.preventDefault(); e.stopPropagation();
            if (e.ctrlKey) { setRole('source'); }
            else if (e.altKey) { const l = GM_getValue(KEY_LATEST_SOURCE, null); if (l) setRole('target', l.sourceId); else GM_notification({text: 'No Source tab found.'}); }
        }, true);
    }

    initialize();

})();
