(function () {
  "use strict";

  if (window.__KOLKAP_WIDGET_LOADED__) return;

  var script =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]');

  var workspaceId =
    script?.getAttribute("data-workspace-id") ||
    script?.getAttribute("data-workspace_id") ||
    "";

  var widgetTitle =
    script?.getAttribute("data-title") || "Chat with us";

  var widgetSubtitle =
    script?.getAttribute("data-subtitle") ||
    "Ask a question and our AI assistant will help.";

  var welcomeMessage =
    script?.getAttribute("data-welcome-message") ||
    script?.getAttribute("data-welcome_message") ||
    "Hi, how can we help you today?";

  var accentColor =
    script?.getAttribute("data-accent-color") || "#7CFF3D";

  if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(accentColor)) accentColor = "#7CFF3D";

  var apiOrigin = "https://www.kolkap.com";

  try {
    if (script?.src) {
      apiOrigin = new URL(script.src).origin;
    }
  } catch {
    apiOrigin = "https://www.kolkap.com";
  }

  var apiUrl = apiOrigin + "/api/website-chat/message";

  if (!workspaceId) {
    console.warn("Kolkap Website Chat: missing data-workspace-id.");
    return;
  }

  window.__KOLKAP_WIDGET_LOADED__ = true;

  var storageKey = "kolkap_widget_" + workspaceId;
  var visitorKey = storageKey + "_visitor_id";
  var conversationKey = storageKey + "_conversation_id";
  var sessionKey = storageKey + "_session_token";
  var customerNameKey = storageKey + "_customer_name";
  var customerEmailKey = storageKey + "_customer_email";
  var pendingKey = storageKey + "_pending_message";
  var memory = Object.create(null);

  function getStoredValue(key) {
    if (Object.prototype.hasOwnProperty.call(memory, key)) return memory[key];
    try { memory[key] = window.localStorage.getItem(key) || ""; }
    catch { memory[key] = ""; }
    return memory[key];
  }

  function saveStoredValue(key, value) {
    memory[key] = value || "";
    try {
      if (value) window.localStorage.setItem(key, value);
      else window.localStorage.removeItem(key);
    } catch { /* This tab keeps working when browser storage is blocked. */ }
  }

  function newRequestId() {
    if (window.crypto.randomUUID) return window.crypto.randomUUID();
    var bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.from(bytes, function (n) { return n.toString(16).padStart(2, "0"); }).join("");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }

  function getOrCreateVisitorId() {
    var id = getStoredValue(visitorKey);
    if (!id) { id = newRequestId(); saveStoredValue(visitorKey, id); }
    return id;
  }
  function getConversationId() { return getStoredValue(conversationKey); }
  function getSessionToken() { return getStoredValue(sessionKey); }
  function saveConversationId(id) { if (id) saveStoredValue(conversationKey, id); }
  function saveSessionToken(token) { if (token) saveStoredValue(sessionKey, token); }
  function pageUrl() { return window.location.origin + window.location.pathname; }

  async function timedFetch(url, options, timeout) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, timeout || 15000);
    try { return await fetch(url, Object.assign({}, options, { signal: controller.signal })); }
    finally { window.clearTimeout(timer); }
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (typeof text === "string") {
      element.textContent = text;
    }

    return element;
  }

  function injectStyles() {
    if (document.getElementById("kolkap-widget-style")) return;

    var style = document.createElement("style");
    style.id = "kolkap-widget-style";

    style.textContent = `
      .kolkap-widget-root,
      .kolkap-widget-root * {
        box-sizing: border-box;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .kolkap-widget-root {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 2147483647;
        color: #07111F;
      }

      .kolkap-widget-button {
        width: 64px;
        height: 64px;
        border: 0;
        border-radius: 999px;
        background: #07111F;
        color: #ffffff;
        box-shadow: 0 18px 45px rgba(7, 17, 31, 0.28);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 180ms ease, box-shadow 180ms ease;
      }

      .kolkap-widget-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 22px 55px rgba(7, 17, 31, 0.34);
      }

      .kolkap-widget-button-dot {
        position: absolute;
        right: 4px;
        top: 4px;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        border: 3px solid #ffffff;
        background: ${accentColor};
      }

      .kolkap-widget-panel {
        width: min(390px, calc(100vw - 32px));
        height: min(620px, calc(100vh - 110px));
        border-radius: 28px;
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.1);
        box-shadow: 0 24px 80px rgba(7, 17, 31, 0.28);
        overflow: hidden;
        display: none;
        flex-direction: column;
      }

      .kolkap-widget-panel.is-open {
        display: flex;
      }

      .kolkap-widget-header {
        background: #07111F;
        color: #ffffff;
        padding: 20px;
      }

      .kolkap-widget-header-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .kolkap-widget-brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .kolkap-widget-logo {
        width: 44px;
        height: 44px;
        border-radius: 16px;
        background: ${accentColor};
        color: #07111F;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 950;
        line-height: 1;
      }

      .kolkap-widget-title {
        margin: 0;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .kolkap-widget-subtitle {
        margin: 4px 0 0;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.72);
      }

      .kolkap-widget-close {
        width: 36px;
        height: 36px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: #ffffff;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
      }

      .kolkap-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 18px;
        background: #F7F9FA;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .kolkap-widget-message {
        max-width: 86%;
        border-radius: 20px;
        padding: 12px 14px;
        font-size: 14px;
        font-weight: 650;
        line-height: 1.55;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .kolkap-widget-message.bot {
        align-self: flex-start;
        background: #ffffff;
        color: #07111F;
        border: 1px solid rgba(15, 23, 42, 0.08);
      }

      .kolkap-widget-message.user {
        align-self: flex-end;
        background: #07111F;
        color: #ffffff;
      }

      .kolkap-widget-typing {
        align-self: flex-start;
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 20px;
        padding: 12px 14px;
        color: #64748b;
        font-size: 14px;
        font-weight: 800;
      }

      .kolkap-widget-form {
        border-top: 1px solid rgba(15, 23, 42, 0.08);
        background: #ffffff;
        padding: 14px;
        display: grid;
        gap: 10px;
      }

      .kolkap-widget-profile {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .kolkap-widget-profile.is-hidden {
        display: none;
      }

      .kolkap-widget-profile-input {
        min-width: 0;
        height: 42px;
        border: 1px solid rgba(15, 23, 42, 0.1);
        border-radius: 14px;
        background: #F7F9FA;
        padding: 0 12px;
        color: #07111F;
        font-size: 12px;
        font-weight: 700;
        outline: none;
      }

      .kolkap-widget-profile-input:focus {
        border-color: #07111F;
        background: #ffffff;
      }

      .kolkap-widget-input-row {
        display: flex;
        gap: 10px;
        align-items: flex-end;
      }

      .kolkap-widget-input {
        min-height: 48px;
        max-height: 120px;
        resize: none;
        flex: 1;
        border: 1px solid rgba(15, 23, 42, 0.12);
        border-radius: 18px;
        background: #F7F9FA;
        padding: 13px 14px;
        color: #07111F;
        outline: none;
        font-size: 14px;
        font-weight: 650;
        line-height: 1.45;
      }

      .kolkap-widget-input:focus {
        border-color: #07111F;
        background: #ffffff;
      }

      .kolkap-widget-send {
        width: 48px;
        height: 48px;
        border: 0;
        border-radius: 18px;
        background: ${accentColor};
        color: #07111F;
        cursor: pointer;
        font-size: 20px;
        font-weight: 950;
      }

      .kolkap-widget-send:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .kolkap-widget-footer {
        text-align: center;
        color: #64748b;
        font-size: 11px;
        font-weight: 800;
      }

      .kolkap-widget-footer a {
        color: #07111F;
        text-decoration: none;
        font-weight: 950;
      }

      @media (max-width: 520px) {
        .kolkap-widget-root {
          right: 12px;
          bottom: 12px;
        }

        .kolkap-widget-panel {
          width: calc(100vw - 24px);
          height: calc(100vh - 92px);
          border-radius: 24px;
        }

        .kolkap-widget-button {
          width: 60px;
          height: 60px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function buildWidget() {
    injectStyles();

    var root = createElement("div", "kolkap-widget-root");

    var panel = createElement("section", "kolkap-widget-panel");

    var button = createElement("button", "kolkap-widget-button");
    button.type = "button";
    button.setAttribute("aria-label", "Open Kolkap chat");
    button.innerHTML =
      '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5C4 4.12 5.12 3 6.5 3h11C18.88 3 20 4.12 20 5.5v7C20 13.88 18.88 15 17.5 15H9l-5 5V5.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span class="kolkap-widget-button-dot"></span>';

    var header = createElement("div", "kolkap-widget-header");
    var headerTop = createElement("div", "kolkap-widget-header-top");
    var brand = createElement("div", "kolkap-widget-brand");
    var logo = createElement("div", "kolkap-widget-logo", "k");
    var copy = createElement("div");

    var title = createElement("h2", "kolkap-widget-title", widgetTitle);
    var subtitle = createElement("p", "kolkap-widget-subtitle", widgetSubtitle);

    var closeButton = createElement("button", "kolkap-widget-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close Kolkap chat");

    copy.appendChild(title);
    copy.appendChild(subtitle);
    brand.appendChild(logo);
    brand.appendChild(copy);
    headerTop.appendChild(brand);
    headerTop.appendChild(closeButton);
    header.appendChild(headerTop);

    var messages = createElement("div", "kolkap-widget-messages");

    var welcome = createElement(
      "div",
      "kolkap-widget-message bot",
      welcomeMessage
    );

    messages.appendChild(welcome);

    var form = createElement("form", "kolkap-widget-form");
    var profile = createElement("div", "kolkap-widget-profile");
    var row = createElement("div", "kolkap-widget-input-row");

    var nameInput = createElement("input", "kolkap-widget-profile-input");
    nameInput.type = "text";
    nameInput.setAttribute("aria-label", "Your name (optional)");
    nameInput.maxLength = 100;
    nameInput.placeholder = "Your name (optional)";
    nameInput.autocomplete = "name";
    nameInput.value = getStoredValue(customerNameKey);

    var emailInput = createElement("input", "kolkap-widget-profile-input");
    emailInput.type = "email";
    emailInput.setAttribute("aria-label", "Your email (optional)");
    emailInput.maxLength = 254;
    emailInput.placeholder = "Your email (optional)";
    emailInput.autocomplete = "email";
    emailInput.value = getStoredValue(customerEmailKey);

    var input = createElement("textarea", "kolkap-widget-input");
    input.placeholder = "Write your message...";
    input.rows = 1;
    input.maxLength = 2000;
    input.setAttribute("aria-label", "Your message");

    var send = createElement("button", "kolkap-widget-send", "➜");
    send.type = "submit";
    send.setAttribute("aria-label", "Send message");

    var footer = createElement("div", "kolkap-widget-footer");
    footer.innerHTML =
      'Powered by <a href="https://www.kolkap.com" target="_blank" rel="noreferrer">Kolkap</a>';

    row.appendChild(input);
    row.appendChild(send);
    profile.appendChild(nameInput);
    profile.appendChild(emailInput);

    if (getConversationId() && getSessionToken()) {
      profile.classList.add("is-hidden");
    }

    form.appendChild(profile);
    form.appendChild(row);
    form.appendChild(footer);

    if (getConversationId() && getSessionToken()) {
      profile.classList.add("is-hidden");
    }

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(form);

    root.appendChild(panel);
    root.appendChild(button);
    document.body.appendChild(root);

    function scrollToBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(type, text) {
      var item = createElement(
        "div",
        "kolkap-widget-message " + type,
        text || ""
      );

      messages.appendChild(item);
      scrollToBottom();

      return item;
    }

    var status = createElement("div", "kolkap-widget-footer");
    status.setAttribute("role", "status");
    form.appendChild(status);
    var rendered = Object.create(null);
    var cursor = 0;
    var pollTimer = null;
    var retryTimer = null;
    var isPolling = false;
    var isSending = false;
    var pendingAccepted = false;
    var optimistic = null;
    var pending = null;
    try {
      var storedPending = JSON.parse(getStoredValue(pendingKey) || "null");
      if (storedPending && storedPending.workspace_id === workspaceId && storedPending.request_id && typeof storedPending.message === "string") pending = storedPending;
    } catch { /* Discard a malformed saved draft. */ }
    if (pending) input.value = pending.message;

    function setPending(value) {
      pending = value;
      saveStoredValue(pendingKey, value ? JSON.stringify(value) : "");
    }

    function resetSession() {
      saveStoredValue(conversationKey, "");
      saveStoredValue(sessionKey, "");
      setPending(null);
      pendingAccepted = false;
      cursor = 0;
      Object.keys(rendered).forEach(function (id) { rendered[id].node.remove(); });
      rendered = Object.create(null);
      profile.classList.remove("is-hidden");
    }

    function renderMessages(rows) {
      rows.forEach(function (message) {
        if (!message || !message.id || rendered[message.id]) return;
        var node = addMessage(message.sender_type === "customer" ? "user" : "bot", message.message_text);
        rendered[message.id] = { node: node, sequence: Number(message.website_message_sequence) };
      });
      Object.keys(rendered).sort(function (a, b) { return rendered[a].sequence - rendered[b].sequence; }).forEach(function (id) {
        messages.appendChild(rendered[id].node);
      });
      scrollToBottom();
    }

    async function pollForReplies() {
      if (!getConversationId() || !getSessionToken() || isPolling || isSending || document.hidden || !panel.classList.contains("is-open")) return;
      isPolling = true;
      var polledConversation = getConversationId();
      try {
        for (var page = 0; page < 10; page++) {
          var url = new URL(apiUrl);
          url.searchParams.set("mode", "history");
          url.searchParams.set("workspace_id", workspaceId);
          url.searchParams.set("conversation_id", polledConversation);
          url.searchParams.set("visitor_id", getOrCreateVisitorId());
          url.searchParams.set("page_url", pageUrl());
          url.searchParams.set("after", String(cursor));
          var response = await timedFetch(url.toString(), { method: "GET", mode: "cors", cache: "no-store", headers: { "X-Kolkap-Session": getSessionToken() } });
          if (getConversationId() !== polledConversation) return;
          if (response.status === 401) { if (!isSending) resetSession(); return; }
          if (!response.ok) return;
          var result = await response.json();
          if (!Array.isArray(result.messages)) return;
          // A submit may have started while this poll was on the network.
          if (isSending) return;
          renderMessages(result.messages);
          var next = Number(result.next_cursor);
          if (!Number.isFinite(next) || next <= cursor) break;
          cursor = next;
          if (!result.has_more) break;
        }
      } catch { /* The next poll continues from the same cursor. */ }
      finally { isPolling = false; }
    }

    function startPolling() {
      if (!panel.classList.contains("is-open")) return;
      if (!pollTimer) pollTimer = window.setInterval(pollForReplies, 4000);
      pollForReplies();
    }
    function stopPolling() {
      if (pollTimer) window.clearInterval(pollTimer);
      pollTimer = null;
    }
    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      button.style.display = open ? "none" : "flex";
      if (open) {
        if (pending && !isSending) sendPending();
        startPolling();
        input.focus();
      } else { stopPolling(); button.focus(); }
    }

    async function sendPending() {
      if (!pending || isSending) return;
      if (retryTimer) { window.clearTimeout(retryTimer); retryTimer = null; }
      isSending = true;
      send.disabled = true;
      input.disabled = true;
      nameInput.disabled = true;
      emailInput.disabled = true;
      status.textContent = pendingAccepted ? "Your message is saved. Checking for a reply…" : "Sending your message…";
      var submitted = pending;
      if (!optimistic && !pendingAccepted) optimistic = addMessage("user", submitted.message);
      try {
        var response = await timedFetch(apiUrl, { method: "POST", mode: "cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submitted) }, 65000);
        var result = await response.json();
        if (!response.ok || result.error) {
          if (response.status === 401) resetSession();
          if (response.status === 400) setPending(null);
          throw new Error(result.error || "Your message could not be confirmed. Please try again.");
        }
        saveConversationId(result.conversation_id);
        saveSessionToken(result.session_token);
        profile.classList.add("is-hidden");
        if (optimistic) { optimistic.remove(); optimistic = null; }
        if (input.value.trim() === submitted.message) input.value = "";
        if (result.pending) {
          pendingAccepted = true;
          status.textContent = "Your message is saved. Waiting for a reply…";
          retryTimer = window.setTimeout(sendPending, 10000);
        } else {
          pendingAccepted = false;
          setPending(null);
          status.textContent = result.reply_message_id ? "" : (result.reply || "Your message is saved.");
        }
      } catch (error) {
        if (optimistic) { optimistic.remove(); optimistic = null; }
        input.value = submitted.message;
        pendingAccepted = false;
        status.textContent = error.message || "Connection lost. Your draft is kept—send it again to check.";
      } finally {
        isSending = false;
        send.disabled = pendingAccepted;
        input.disabled = pendingAccepted;
        nameInput.disabled = false;
        emailInput.disabled = false;
        startPolling();
      }
    }

    button.addEventListener("click", function () { setOpen(true); });
    closeButton.addEventListener("click", function () { setOpen(false); });
    panel.addEventListener("keydown", function (event) { if (event.key === "Escape") setOpen(false); });
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        if (!isSending && !pendingAccepted) form.requestSubmit();
      }
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = input.value.trim();
      if (isSending || pendingAccepted || !message) return;
      if (pending && pending.message !== message) {
        input.value = pending.message;
        status.textContent = "Please send your previous message again to confirm it first.";
        return;
      }
      if (!pending) {
        saveStoredValue(customerNameKey, nameInput.value.trim());
        saveStoredValue(customerEmailKey, emailInput.value.trim().toLowerCase());
        setPending({ request_id: newRequestId(), workspace_id: workspaceId, conversation_id: getConversationId(), session_token: getSessionToken(),
          customer_name: getStoredValue(customerNameKey), customer_email: getStoredValue(customerEmailKey), customer_phone: "",
          message: message, language: "auto", page_url: pageUrl(), visitor_id: getOrCreateVisitorId() });
      }
      sendPending();
    });
  }

  async function loadWidget() {
    try {
      var url = new URL(apiUrl);
      url.searchParams.set("mode", "config");
      url.searchParams.set("workspace_id", workspaceId);
      url.searchParams.set("page_url", pageUrl());
      var response = await timedFetch(url.toString(), { mode: "cors", cache: "no-store" });
      if (!response.ok) return;
      var config = await response.json();
      if (!config.active) return;
      widgetTitle = config.title || widgetTitle;
      widgetSubtitle = config.subtitle || widgetSubtitle;
      welcomeMessage = config.welcome_message || welcomeMessage;
      buildWidget();
    } catch { console.warn("Kolkap Website Chat is temporarily unavailable."); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadWidget);
  } else {
    loadWidget();
  }
})();
