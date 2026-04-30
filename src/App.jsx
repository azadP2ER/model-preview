import { useEffect, useRef, useState, useCallback } from "react";
import "@google/model-viewer";

const CUSTOM_URL_VALUE = "__custom__";
const NEUTRAL_ENV = "null";

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

export default function App() {
  const viewerRef = useRef(null);
  const [models, setModels] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [selected, setSelected] = useState(CUSTOM_URL_VALUE);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [env, setEnv] = useState(NEUTRAL_ENV);

  const loadModel = useCallback((src) => {
    setError(null);
    if (!src) return;
    if (viewerRef.current) viewerRef.current.src = src;
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("./models.json")
        .then((r) => r.json())
        .catch(() => []),
      fetch("./environments.json")
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([modelData, envData]) => {
      setModels(modelData);
      setEnvironments(envData);

      if (envData.length > 0) {
        const firstEnv = envData[0];
        const envKey = firstEnv.url === null ? NEUTRAL_ENV : firstEnv.url;
        setEnv(envKey);
      }

      const paramUrl = getUrlParam("url");

      if (paramUrl) {
        const match = modelData.find((m) => m.url === paramUrl);
        setSelected(match ? match.url : CUSTOM_URL_VALUE);
        setUrl(paramUrl);
        loadModel(paramUrl);
      } else if (modelData.length > 0) {
        const first = modelData[0];
        setSelected(first.url);
        setUrl(first.url);
        loadModel(first.url);
      }
    });
  }, [loadModel]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const handler = (e) => setError(e.detail?.message || "Unknown error");
    el.addEventListener("error", handler);
    return () => el.removeEventListener("error", handler);
  }, []);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const targetEnv = env === NEUTRAL_ENV ? null : env;
    el.environmentImage = targetEnv;
    if (targetEnv) {
      const timeout = setTimeout(() => {
        const img = new Image();
        img.onerror = () => { el.environmentImage = null; };
        img.src = targetEnv;
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [env]);

  function handleModelChange(e) {
    const value = e.target.value;
    setSelected(value);
    if (value === CUSTOM_URL_VALUE) {
      setUrl("");
      return;
    }
    setUrl(value);
    window.history.replaceState({}, "", `?url=${encodeURIComponent(value)}`);
    loadModel(value);
  }

  function handleLoad() {
    const trimmed = url.trim();
    if (!trimmed) return;
    const next = new URL(window.location);
    next.searchParams.set("url", trimmed);
    window.history.replaceState({}, "", next);
    loadModel(trimmed);
    const match = models.find((m) => m.url === trimmed);
    setSelected(match ? match.url : CUSTOM_URL_VALUE);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleLoad();
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "glb" || ext === "gltf") {
      loadModel(URL.createObjectURL(file));
      setUrl(file.name);
      setSelected(CUSTOM_URL_VALUE);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (ext === "hdr") {
      setEnv(URL.createObjectURL(file));
    }
  }

  return (
    <div style={styles.body}>
      <div style={styles.toolbar}>
        <label style={styles.label}>Model:</label>
        <select
          style={styles.select}
          value={selected}
          onChange={handleModelChange}
        >
          <option value="" disabled>
            -- Pick a model --
          </option>
          <option value={CUSTOM_URL_VALUE}>Custom URL…</option>
          {models.map((m) => (
            <option key={m.url} value={m.url}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          style={styles.input}
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSelected(CUSTOM_URL_VALUE);
          }}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/model.glb or ./models/file.glb"
        />
        <label style={styles.label}>Env:</label>
        <select
          style={styles.select}
          value={env}
          onChange={(e) => setEnv(e.target.value)}
        >
          {environments.map((e) => (
            <option
              key={e.url === null ? NEUTRAL_ENV : e.url}
              value={e.url === null ? NEUTRAL_ENV : e.url}
            >
              {e.name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={styles.dropZone}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <model-viewer
          ref={viewerRef}
          style={styles.viewer}
          camera-controls
          auto-rotate
          shadow-intensity="1"
          exposure="1"
          touch-action="pan-y"
        />

        {dragging && (
          <div style={styles.dropOverlay}>
            Drop a .glb / .gltf / .hdr file here
          </div>
        )}

        {error && (
          <div style={styles.errorOverlay}>
            <div style={styles.errorTitle}>Failed to load model</div>
            <div style={styles.errorDetail}>{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  body: {
    background: "#111",
    color: "#eee",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    background: "#1a1a1a",
    borderBottom: "1px solid #333",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  label: { fontSize: "13px", color: "#aaa" },
  select: {
    background: "#222",
    border: "1px solid #444",
    color: "#eee",
    padding: "6px 10px",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
    maxWidth: "220px",
  },
  input: {
    flex: 1,
    minWidth: "200px",
    background: "#222",
    border: "1px solid #444",
    color: "#eee",
    padding: "6px 10px",
    borderRadius: "4px",
    fontSize: "13px",
  },
  primaryBtn: {
    background: "#2a7de1",
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
  },
  dropZone: {
    flex: 1,
    display: "flex",
    position: "relative",
    overflow: "hidden",
  },
  viewer: { width: "100%", height: "100%" },
  dropOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.7)",
    zIndex: 10,
    fontSize: "20px",
    border: "3px dashed #2a7de1",
    pointerEvents: "none",
  },
  errorOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111",
    zIndex: 5,
    color: "#f66",
    flexDirection: "column",
    gap: "8px",
    padding: "20px",
    textAlign: "center",
  },
  errorTitle: { fontSize: "18px", fontWeight: 600 },
  errorDetail: { fontSize: "13px", color: "#999" },
};
