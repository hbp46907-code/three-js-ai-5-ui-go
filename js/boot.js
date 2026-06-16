(function () {
  const threeModuleSources = [
    "./vendor/three.module.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.180.0/three.module.min.js",
    "https://cdn.bootcdn.net/ajax/libs/three.js/0.180.0/three.module.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js"
  ];

  function showBootError() {
    const message = document.createElement("div");
    message.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:9999",
      "display:grid",
      "place-items:center",
      "padding:2rem",
      "background:#02030b",
      "color:#eef8ff",
      "font:16px/1.8 Arial, sans-serif",
      "text-align:center"
    ].join(";");
    message.innerHTML = [
      "<div>",
      "<h1 style='font-size:22px;margin:0 0 12px;'>页面核心库加载失败</h1>",
      "<p style='margin:0;'>请确认网络可访问 CDN，或把 three.module.min.js 放到 vendor 文件夹。</p>",
      "<p style='margin:8px 0 0;color:#8fd8ff;'>当前页面会自动尝试多个 Three.js 模块地址。</p>",
      "</div>"
    ].join("");
    document.body.append(message);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }

  async function loadThree() {
    for (const src of threeModuleSources) {
      try {
        window.THREE = await import(src);
        return;
      } catch (error) {
        // 继续尝试下一个地址，避免某一个 CDN 失败导致白屏。
      }
    }
    throw new Error("Three.js load failed");
  }

  loadThree()
    .then(() => loadScript("./js/main.js"))
    .catch(showBootError);
}());
