(function () {
  "use strict";

  if (window.__KOLKAP_WIDGET_LOADED__) return;
  window.__KOLKAP_WIDGET_LOADED__ = true;

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

  var storageKey = "kolkap_widget_" + workspaceId;
  var visitorKey = storageKey + "_visitor_id";
  var conversationKey = storageKey + "_conversation_id";

  function getOrCreateVisitorId() {
    try {
      var existing = window.localStorage.getItem(visitorKey);
      if (existing) return existing;

      var generated =
        "visitor_" +
        Math.random().toString(36).slice(2) +
        "_" +
        Date.now().toString(36);

      window.localStorage.setItem(visitorKey, generated);
      return generated;
    } catch {
      return "visitor_" + Date.now().toString(36);
    }
  }

  function getConversationId() {
    try {
      return window.localStorage.getItem(conversationKey) || "";
    } catch {
      return "";
    }
  }

  function saveConversationId(value) {
    if (!value) return;

    try {
      window.localStorage.setItem(conversationKey, value);
    } catch {
      // Ignore storage errors.
    }
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
    var row = createElement("div", "kolkap-widget-input-row");

    var input = createElement("textarea", "kolkap-widget-input");
    input.placeholder = "Write your message...";
    input.rows = 1;

    var send = createElement("button", "kolkap-widget-send", "➜");
    send.type = "submit";
    send.setAttribute("aria-label", "Send message");

    var footer = createElement("div", "kolkap-widget-footer");
    footer.innerHTML =
      'Powered by <a href="https://www.kolkap.com" target="_blank" rel="noreferrer">Kolkap</a>';

    row.appendChild(input);
    row.appendChild(send);
    form.appendChild(row);
    form.appendChild(footer);

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

    function addTyping() {
      var item = createElement(
        "div",
        "kolkap-widget-typing",
        "Assistant is replying..."
      );

      messages.appendChild(item);
      scrollToBottom();

      return item;
    }

    function setOpen(isOpen) {
      if (isOpen) {
        panel.classList.add("is-open");
        button.style.display = "none";

        window.setTimeout(function () {
          input.focus();
        }, 120);
      } else {
        panel.classList.remove("is-open");
        button.style.display = "flex";
      }
    }

    button.addEventListener("click", function () {
      setOpen(true);
    });

    closeButton.addEventListener("click", function () {
      setOpen(false);
    });

    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var message = input.value.trim();

      if (!message) return;

      input.value = "";
      input.style.height = "auto";
      send.disabled = true;

      addMessage("user", message);

      var typing = addTyping();

      try {
        var response = await fetch(apiUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            conversation_id: getConversationId(),
            customer_name: "Website Visitor",
            customer_phone: "",
            customer_email: "",
            message: message,
            language: "auto",
            page_url: window.location.href,
            visitor_id: getOrCreateVisitorId(),
          }),
        });

        var result = await response.json().catch(function () {
          return {};
        });

        if (typing && typing.parentNode) {
          typing.parentNode.removeChild(typing);
        }

        if (!response.ok || result.error) {
          addMessage(
            "bot",
            result.error ||
              "Sorry, we could not send this message right now. Please try again later."
          );

          return;
        }

        if (result.conversation_id) {
          saveConversationId(result.conversation_id);
        }

        addMessage(
          "bot",
          result.reply ||
            "Thanks. Your message has been received and the team can follow up."
        );
      } catch {
        if (typing && typing.parentNode) {
          typing.parentNode.removeChild(typing);
        }

        addMessage(
          "bot",
          "Sorry, we could not connect right now. Please try again later."
        );
      } finally {
        send.disabled = false;
        input.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();