(() => {
  const projectBase = "/Harsha-Nimmagadda.github.io";
  const projectAsset = /^\/(?:assets|models|textures)(?:\/|$)/;

  const rewrite = (value) => {
    if (value instanceof URL) {
      return rewrite(value.href);
    }
    if (typeof value !== "string") {
      return value;
    }
    if (value === "/") {
      return `${projectBase}/`;
    }
    if (projectAsset.test(value)) {
      return `${projectBase}${value}`;
    }
    const url = new URL(value, window.location.href);
    if (url.origin === window.location.origin && projectAsset.test(url.pathname)) {
      url.pathname = `${projectBase}${url.pathname}`;
      return url.href;
    }
    return value;
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (input instanceof Request) {
      return nativeFetch(new Request(rewrite(input.url), input), init);
    }
    return nativeFetch(rewrite(input), init);
  };

  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    return nativeOpen.call(this, method, rewrite(url), ...args);
  };

  const nativeSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    const normalizedName = name.toLowerCase();
    const normalizedValue = ["href", "poster", "src"].includes(normalizedName)
      ? rewrite(value)
      : value;
    return nativeSetAttribute.call(this, name, normalizedValue);
  };

  const patchProperty = (prototype, property) => {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, property);
    if (!descriptor?.get || !descriptor?.set) {
      return;
    }
    Object.defineProperty(prototype, property, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(value) {
        descriptor.set.call(this, rewrite(value));
      },
    });
  };

  patchProperty(HTMLAnchorElement.prototype, "href");
  patchProperty(HTMLImageElement.prototype, "src");
  patchProperty(HTMLMediaElement.prototype, "src");
  patchProperty(HTMLSourceElement.prototype, "src");
})();
