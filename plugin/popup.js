(() => {
  "use strict";

  const api = typeof browser !== "undefined" ? browser : chrome;
  const checkbox = document.getElementById("ignoreLinks");

  api.storage.sync.get({ ignoreLinks: true }).then((settings) => {
    checkbox.checked = settings.ignoreLinks;
  });

  checkbox.addEventListener("change", () => {
    api.storage.sync.set({ ignoreLinks: checkbox.checked });
  });
})();
