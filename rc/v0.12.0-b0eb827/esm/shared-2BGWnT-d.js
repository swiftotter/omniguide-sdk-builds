function resolveContainer(mount, defaultId) {
  var _a, _b;
  if (!mount) {
    return document.getElementById(defaultId);
  }
  const target = mount.target instanceof HTMLElement ? mount.target : document.querySelector(mount.target);
  if (!target) {
    return null;
  }
  const position = mount.position ?? "inside";
  if (position === "inside") {
    return target;
  }
  if (position === "replace") {
    const container2 = document.createElement("div");
    target.replaceWith(container2);
    return container2;
  }
  const container = document.createElement("div");
  if (position === "before") {
    (_a = target.parentNode) == null ? void 0 : _a.insertBefore(container, target);
  } else {
    (_b = target.parentNode) == null ? void 0 : _b.insertBefore(container, target.nextSibling);
  }
  return container;
}
export {
  resolveContainer as r
};
//# sourceMappingURL=shared-2BGWnT-d.js.map
