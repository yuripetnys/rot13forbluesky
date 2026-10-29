(() => {
  "use strict";

  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  const api = typeof browser !== "undefined" ? browser : chrome;
  let iconTemplate = null;
  fetch(api.runtime.getURL("icon.svg"))
    .then((r) => r.text())
    .then((txt) => {
      const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
      iconTemplate = doc.documentElement;
    });

  function makeIcon(size = 18) {
    const svg = iconTemplate
      ? iconTemplate.cloneNode(true)
      : document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    return svg;
  }

  let lastDropdownPost = null;
  let lastOpenWasPostDropdown = false;
  document.addEventListener(
    "click",
    (e) => {
      const btn =
        e.target.closest &&
        e.target.closest('[data-testid="postDropdownBtn"]');
      lastOpenWasPostDropdown = !!btn;
      if (btn) {
        let el = btn.parentElement;
        lastDropdownPost = null;
        while (el) {
          if (el.querySelector('[data-testid="postText"], [data-word-wrap="1"]')) {
            lastDropdownPost = el;
            break;
          }
          el = el.parentElement;
        }
      }
    },
    true
  );

  function enhanceDropdown(menu) {
    if (menu.dataset.rot13Enhanced) return;
    if (!lastOpenWasPostDropdown) return;

    const items = menu.querySelectorAll('[role="menuitem"]');
    if (!items.length) return;
    menu.dataset.rot13Enhanced = "1";

    const template = items[items.length - 1];
    const item = template.cloneNode(true);
    item.removeAttribute("data-testid");

    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
    let labelNode = null,
      node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim()) labelNode = node;
    }
    if (labelNode) labelNode.textContent = "Decode Rot13";

    const svg = item.querySelector("svg");
    if (svg) svg.replaceWith(makeIcon(18));

    item.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (lastDropdownPost) decodePostText(lastDropdownPost);
        document.body.click();
      },
      true
    );

    const separator = menu.querySelector('[role="separator"], hr');
    if (separator) template.parentNode.appendChild(separator.cloneNode(true));
    template.parentNode.appendChild(item);
  }

  function decodePostText(post) {
    const target =
      post.querySelector('[data-testid="postText"]') ||
      post.querySelector('[data-word-wrap="1"]') ||
      post;
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach((t) => {
      if (t.textContent.trim()) t.textContent = rot13(t.textContent);
    });
  }

  function enhanceComposer() {
    const emojiButtons = document.querySelectorAll(
      'button[aria-label="Open emoji picker"]'
    );
    const editors = [...document.querySelectorAll('[contenteditable="true"]')];

    emojiButtons.forEach((emojiBtn) => {
      if (emojiBtn.parentElement.querySelector(".rot13-encode-btn")) return;

      let editor = null;
      for (const ed of editors) {
        if (
          ed.compareDocumentPosition(emojiBtn) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          editor = ed;
        } else {
          break;
        }
      }
      if (!editor) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rot13-encode-btn " + emojiBtn.className;
      btn.title = "Encode post with Rot13";
      btn.setAttribute("aria-label", "Encode post with Rot13");
      btn.appendChild(makeIcon(20));

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        encodeEditor(editor);
      });

      emojiBtn.parentElement.insertBefore(btn, emojiBtn.nextSibling);
    });
  }

  function encodeEditor(editor) {
    const text = editor.innerText;
    const encoded = rot13(text);

    editor.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(editor);
    sel.addRange(range);

    if (!document.execCommand("insertText", false, encoded)) {
      editor.textContent = encoded;
      editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
  }

  function scan() {
    document.querySelectorAll('[role="menu"]').forEach(enhanceDropdown);
    enhanceComposer();
  }

  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();
