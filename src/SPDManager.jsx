import { useState, useEffect, useRef } from "react";

const COLORS = {
  design:   { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
  backend:  { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  frontend: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  devops:   { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  api:      { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  general:  { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  docs:     { bg: "#e0f2fe", text: "#075985", border: "#7dd3fc" },
  testing:  { bg: "#fff7ed", text: "#9a3412", border: "#fdba74" },
};

const FILE_ICONS = {
  pdf: "📄", doc: "📝", xls: "📊", img: "🖼", code: "💻",
  vid: "🎬", zip: "📦", ppt: "📑", txt: "📃",
};

const STATUS_CONFIG = {
  draft:       { label: "Draft",       bg: "#f3f4f6", text: "#374151" },
  review:      { label: "In Review",   bg: "#fef3c7", text: "#92400e" },
  approved:    { label: "Approved",    bg: "#dcfce7", text: "#166534" },
  deprecated:  { label: "Deprecated",  bg: "#fee2e2", text: "#991b1b" },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function Badge({ tag }) {
  const c = COLORS[tag] || COLORS.general;
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 4,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
      fontWeight: 500, whiteSpace: "nowrap",
    }}>{tag}</span>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 4,
      background: c.bg, color: c.text, fontWeight: 500,
    }}>{c.label}</span>
  );
}

function Toast({ message, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "#1f2937", color: "#f9fafb", padding: "9px 16px",
      borderRadius: 8, fontSize: 13, fontWeight: 500,
      opacity: visible ? 1 : 0, transition: "opacity 0.25s",
      pointerEvents: "none",
    }}>{message}</div>
  );
}

function Modal({ open, title, onClose, onSubmit, children }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.38)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-secondary)",
        borderRadius: 14, padding: "22px 24px", width: 360,
        maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>{title}</span>
          <button onClick={onClose} style={btnIcon}>✕</button>
        </div>
        {children}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={btnBase}>Cancel</button>
          <button onClick={onSubmit} style={btnPrimary}>Create</button>
        </div>
      </div>
    </div>
  );
}

const btnBase = {
  padding: "7px 14px", border: "0.5px solid var(--color-border-secondary)",
  borderRadius: 8, fontSize: 13, cursor: "pointer",
  background: "var(--color-background-primary)", color: "var(--color-text-primary)",
};
const btnPrimary = {
  ...btnBase, background: "#2563eb", color: "#fff", border: "none", fontWeight: 500,
};
const btnIcon = {
  background: "none", border: "0.5px solid var(--color-border-secondary)",
  borderRadius: 6, width: 26, height: 26, cursor: "pointer",
  fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--color-text-secondary)",
};

const inputStyle = {
  width: "100%", padding: "7px 10px", boxSizing: "border-box",
  border: "0.5px solid var(--color-border-secondary)", borderRadius: 8,
  fontSize: 13, background: "var(--color-background-secondary)",
  color: "var(--color-text-primary)", marginBottom: 10, outline: "none",
};
const labelStyle = { fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 };

export default function SPDManager() {
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selProject, setSelProject] = useState(null);
  const [selFolder, setSelFolder] = useState(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [view, setView] = useState("grid");
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("spd-manager-v1");
      if (saved) {
        const d = JSON.parse(saved);
        setProjects(d.projects || []);
        setFolders(d.folders || []);
        setFiles(d.files || []);
      }
    } catch (_) {}
  }, []);

  const save = (p, fo, fi) => {
    try { localStorage.setItem("spd-manager-v1", JSON.stringify({ projects: p, folders: fo, files: fi })); } catch (_) {}
  };

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2400);
  };

  const openModal = (type) => {
    const defaults = {
      project: { name: "", desc: "", color: "blue" },
      folder: { name: "", tag: "general", parentId: "" },
      file: { name: "", type: "doc", tag: "general", desc: "", version: "1.0", folderId: "", status: "draft" },
    };
    if (type !== "project" && !selProject) { showToast("Select a project first"); return; }
    setForm(defaults[type]);
    setModal(type);
  };

  const closeModal = () => setModal(null);

  const submitModal = () => {
    if (!form.name?.trim()) { showToast("Name is required"); return; }
    const id = uid();
    if (modal === "project") {
      const newP = [...projects, { id, name: form.name.trim(), desc: form.desc || "", color: form.color || "blue", created: Date.now() }];
      setProjects(newP); save(newP, folders, files);
      showToast("Project created");
    } else if (modal === "folder") {
      const newF = [...folders, { id, name: form.name.trim(), projectId: selProject, parentId: form.parentId || null, tag: form.tag || "general", created: Date.now() }];
      setFolders(newF); save(projects, newF, files);
      if (form.parentId) setSelFolder(form.parentId);
      showToast("Folder created");
    } else if (modal === "file") {
      const newFi = [...files, { id, name: form.name.trim(), projectId: selProject, folderId: form.folderId || null, type: form.type || "doc", tag: form.tag || "general", desc: form.desc || "", version: form.version || "1.0", status: form.status || "draft", created: Date.now() }];
      setFiles(newFi); save(projects, folders, newFi);
      if (form.folderId) setSelFolder(form.folderId);
      showToast("File added");
    }
    closeModal();
  };

  const deleteItem = (type, id) => {
    if (type === "project") {
      const newP = projects.filter(p => p.id !== id);
      const newF = folders.filter(f => f.projectId !== id);
      const newFi = files.filter(f => f.projectId !== id);
      setProjects(newP); setFolders(newF); setFiles(newFi);
      save(newP, newF, newFi);
      if (selProject === id) { setSelProject(null); setSelFolder(null); }
      showToast("Project deleted");
    } else if (type === "folder") {
      const newF = folders.filter(f => f.id !== id && f.parentId !== id);
      const newFi = files.filter(f => f.folderId !== id);
      setFolders(newF); setFiles(newFi);
      save(projects, newF, newFi);
      if (selFolder === id) setSelFolder(null);
      showToast("Folder deleted");
    } else {
      const newFi = files.filter(f => f.id !== id);
      setFiles(newFi); save(projects, folders, newFi);
      showToast("File deleted");
    }
  };

  const getPath = (folderId) => {
    const parts = [];
    let f = folders.find(x => x.id === folderId);
    while (f) { parts.unshift(f.name); f = folders.find(x => x.id === f.parentId); }
    const p = projects.find(x => x.id === selProject);
    if (p) parts.unshift(p.name);
    return parts.join(" › ") || "Root";
  };

  const getBreadcrumbs = () => {
    const crumbs = [];
    if (selProject) {
      const p = projects.find(x => x.id === selProject);
      if (p) crumbs.push({ label: p.name, action: () => { setSelProject(p.id); setSelFolder(null); } });
    }
    if (selFolder) {
      const ancestors = [];
      let f = folders.find(x => x.id === selFolder);
      while (f) { ancestors.unshift(f); f = folders.find(x => x.id === f.parentId); }
      ancestors.forEach(f => crumbs.push({ label: f.name, action: () => setSelFolder(f.id) }));
    }
    return crumbs;
  };

  const getItems = () => {
    if (search || tagFilter) {
      return {
        isSearch: true,
        folders: folders.filter(f =>
          (!search || f.name.toLowerCase().includes(search.toLowerCase())) &&
          (!tagFilter || f.tag === tagFilter)
        ),
        files: files.filter(f =>
          (!search || f.name.toLowerCase().includes(search.toLowerCase()) || f.desc?.toLowerCase().includes(search.toLowerCase())) &&
          (!tagFilter || f.tag === tagFilter)
        ),
      };
    }
    if (!selProject) return { projects };
    return {
      folders: folders.filter(f => f.projectId === selProject && (selFolder ? f.parentId === selFolder : !f.parentId)),
      files: files.filter(f => f.projectId === selProject && f.folderId === (selFolder || null)),
    };
  };

  const items = getItems();
  const breadcrumbs = getBreadcrumbs();
  const projectColors = { blue: "#2563eb", teal: "#0f6e56", purple: "#534AB7", coral: "#993C1D", amber: "#854F0B" };

  const folderOptions = selProject
    ? [{ id: "", name: "Root of project" }, ...folders.filter(f => f.projectId === selProject).map(f => ({ id: f.id, name: f.name }))]
    : [{ id: "", name: "Root of project" }];

  const parentOptions = selProject
    ? [{ id: "", name: "Root of project" }, ...folders.filter(f => f.projectId === selProject && !f.parentId).map(f => ({ id: f.id, name: f.name }))]
    : [{ id: "", name: "Root of project" }];

  const projColorOptions = Object.entries(projectColors);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'DM Sans', system-ui, sans-serif", display: "flex", flexDirection: "column", height: "100vh", background: "var(--color-background-tertiary)" }}>

      {/* Header */}
      <div style={{
        background: "var(--color-background-primary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        padding: "0 20px", height: 52, display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button onClick={() => setSideCollapsed(s => !s)} style={{ ...btnIcon, flexShrink: 0 }}>☰</button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>SPD Manager</span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400 }}>Software Project Documentation</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-text-tertiary)" }}>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search everything…"
            style={{ ...inputStyle, marginBottom: 0, paddingLeft: 28, width: 220, fontSize: 13 }}
          />
        </div>
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ ...inputStyle, marginBottom: 0, width: "auto", fontSize: 12 }}>
          <option value="">All tags</option>
          {Object.keys(COLORS).map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={() => setView(v => v === "grid" ? "list" : "grid")} style={btnBase} title="Toggle view">
          {view === "grid" ? "☰" : "⊞"}
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        {!sideCollapsed && (
          <div style={{
            width: 230, background: "var(--color-background-secondary)",
            borderRight: "0.5px solid var(--color-border-tertiary)",
            display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden",
          }}>
            <div style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Projects</span>
              <button style={btnIcon} onClick={() => openModal("project")} title="New project">+</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
              <TreeItem
                label="All projects" icon="◈" active={!selProject && !search}
                onClick={() => { setSelProject(null); setSelFolder(null); setSearch(""); setTagFilter(""); }}
              />
              {projects.map(p => {
                const active = selProject === p.id && !selFolder;
                const pColor = projectColors[p.color] || "#2563eb";
                const subFolders = folders.filter(f => f.projectId === p.id && !f.parentId);
                return (
                  <div key={p.id}>
                    <div
                      onClick={() => { setSelProject(p.id); setSelFolder(null); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "5px 8px", borderRadius: 7, cursor: "pointer",
                        background: active ? "var(--color-background-primary)" : "transparent",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: pColor, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{files.filter(f => f.projectId === p.id).length}</span>
                    </div>
                    {selProject === p.id && subFolders.map(f => (
                      <div key={f.id}>
                        <TreeItem
                          label={f.name} icon="▸" indent={1}
                          active={selFolder === f.id}
                          onClick={() => setSelFolder(f.id)}
                        />
                        {selFolder === f.id && folders.filter(sf => sf.parentId === f.id).map(sf => (
                          <TreeItem key={sf.id} label={sf.name} icon="▹" indent={2}
                            active={selFolder === sf.id}
                            onClick={() => setSelFolder(sf.id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
              {projects.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "12px 8px", lineHeight: 1.6 }}>
                  No projects yet.<br />Click + to create one.
                </div>
              )}
            </div>
            {/* Stats */}
            <div style={{ padding: "10px 12px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: 8 }}>
              {[{ l: "Projects", v: projects.length }, { l: "Folders", v: folders.length }, { l: "Files", v: files.length }].map(s => (
                <div key={s.l} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{
            padding: "8px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)",
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--color-background-primary)", flexShrink: 0,
          }}>
            {/* Breadcrumbs */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--color-text-secondary)", flexWrap: "wrap" }}>
              <span
                onClick={() => { setSelProject(null); setSelFolder(null); setSearch(""); }}
                style={{ cursor: "pointer", color: "var(--color-text-secondary)" }}
              >Home</span>
              {breadcrumbs.map((c, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>›</span>
                  <span onClick={c.action} style={{ cursor: "pointer", color: i === breadcrumbs.length - 1 ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: i === breadcrumbs.length - 1 ? 500 : 400 }}>{c.label}</span>
                </span>
              ))}
              {search && <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>· Search: "{search}"</span>}
            </div>
            {selProject && (
              <>
                <button style={btnBase} onClick={() => openModal("folder")}>+ Folder</button>
                <button style={btnPrimary} onClick={() => openModal("file")}>+ File</button>
              </>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {items.projects ? (
              <ProjectsView
                projects={items.projects} files={files} folders={folders}
                projectColors={projectColors}
                onSelect={id => { setSelProject(id); setSelFolder(null); }}
                onDelete={id => deleteItem("project", id)}
                onNew={() => openModal("project")}
              />
            ) : (
              <ItemsView
                folders={items.folders || []} files={items.files || []}
                isSearch={items.isSearch} search={search} view={view}
                getPath={getPath}
                onSelectFolder={setSelFolder}
                onDeleteFolder={id => deleteItem("folder", id)}
                onDeleteFile={id => deleteItem("file", id)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={modal === "project"} title="New project" onClose={closeModal} onSubmit={submitModal}>
        <label style={labelStyle}>Project name</label>
        <input autoFocus style={inputStyle} placeholder="e.g. E-commerce App" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, height: 64, resize: "none" }} placeholder="What is this project about?" value={form.desc || ""} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
        <label style={labelStyle}>Color</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {Object.entries(projectColors).map(([k, v]) => (
            <div key={k} onClick={() => setForm(f => ({ ...f, color: k }))}
              style={{ width: 22, height: 22, borderRadius: "50%", background: v, cursor: "pointer", border: form.color === k ? "2px solid var(--color-text-primary)" : "2px solid transparent" }}
            />
          ))}
        </div>
      </Modal>

      <Modal open={modal === "folder"} title="New folder" onClose={closeModal} onSubmit={submitModal}>
        <label style={labelStyle}>Folder name</label>
        <input autoFocus style={inputStyle} placeholder="e.g. Backend Docs" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <label style={labelStyle}>Tag</label>
        <select style={inputStyle} value={form.tag || "general"} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
          {Object.keys(COLORS).map(t => <option key={t}>{t}</option>)}
        </select>
        <label style={labelStyle}>Inside folder (optional)</label>
        <select style={inputStyle} value={form.parentId || ""} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
          {parentOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </Modal>

      <Modal open={modal === "file"} title="New file" onClose={closeModal} onSubmit={submitModal}>
        <label style={labelStyle}>File name</label>
        <input autoFocus style={inputStyle} placeholder="e.g. API Reference" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type || "doc"} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {Object.keys(FILE_ICONS).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Version</label>
            <input style={inputStyle} placeholder="1.0" value={form.version || ""} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Tag</label>
            <select style={inputStyle} value={form.tag || "general"} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
              {Object.keys(COLORS).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={form.status || "draft"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
        </div>
        <label style={labelStyle}>Description</label>
        <input style={inputStyle} placeholder="Short description…" value={form.desc || ""} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
        <label style={labelStyle}>Inside folder</label>
        <select style={{ ...inputStyle, marginBottom: 0 }} value={form.folderId || ""} onChange={e => setForm(f => ({ ...f, folderId: e.target.value }))}>
          {folderOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </Modal>

      <Toast message={toast.msg} visible={toast.visible} />
    </div>
  );
}

function TreeItem({ label, icon, indent = 0, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 8px", paddingLeft: 8 + indent * 14,
        borderRadius: 7, cursor: "pointer",
        background: active ? "var(--color-background-primary)" : "transparent",
        fontWeight: active ? 500 : 400,
      }}
    >
      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

function ProjectsView({ projects, files, folders, projectColors, onSelect, onDelete, onNew }) {
  if (projects.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 6 }}>No projects yet</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>Create your first project to get started</div>
        <button onClick={onNew} style={btnPrimary}>+ New project</button>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>All projects</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {projects.map(p => {
          const pColor = projectColors[p.color] || "#2563eb";
          const fCount = folders.filter(f => f.projectId === p.id).length;
          const dCount = files.filter(f => f.projectId === p.id).length;
          return (
            <div key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 12, padding: 0, cursor: "pointer",
                overflow: "hidden", position: "relative",
              }}
            >
              <div style={{ height: 5, background: pColor }} />
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4, wordBreak: "break-word" }}>{p.name}</div>
                {p.desc && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8, lineHeight: 1.5 }}>{p.desc.slice(0, 60)}{p.desc.length > 60 ? "…" : ""}</div>}
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                  <span>📁 {fCount}</span>
                  <span>📄 {dCount}</span>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                style={{ ...btnIcon, position: "absolute", top: 10, right: 8 }}
                title="Delete"
              >✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemsView({ folders, files, isSearch, search, view, getPath, onSelectFolder, onDeleteFolder, onDeleteFile }) {
  if (!folders.length && !files.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-secondary)", fontSize: 13 }}>
        {isSearch
          ? <>No results for "<strong>{search}</strong>"</>
          : "Empty here. Add folders or files using the buttons above."
        }
      </div>
    );
  }

  if (view === "list") {
    return (
      <div>
        {folders.length > 0 && (
          <>
            <SectionLabel>Folders</SectionLabel>
            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden" }}>
              {folders.map((f, i) => (
                <div key={f.id}
                  onClick={() => onSelectFolder(f.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    borderBottom: i < folders.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 16 }}>📁</span>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500 }}>{f.name}</span>
                  <Badge tag={f.tag} />
                  {isSearch && <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{getPath(f.parentId || "")}</span>}
                  <button onClick={e => { e.stopPropagation(); onDeleteFolder(f.id); }} style={btnIcon} title="Delete">✕</button>
                </div>
              ))}
            </div>
          </>
        )}
        {files.length > 0 && (
          <>
            <SectionLabel style={{ marginTop: folders.length ? 16 : 0 }}>Files</SectionLabel>
            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden" }}>
              {files.map((f, i) => (
                <div key={f.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    borderBottom: i < files.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{FILE_ICONS[f.type] || "📄"}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500 }}>{f.name}</span>
                  <Badge tag={f.tag} />
                  <StatusBadge status={f.status} />
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>v{f.version}</span>
                  {isSearch && <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{getPath(f.folderId)}</span>}
                  <button onClick={e => { e.stopPropagation(); onDeleteFile(f.id); }} style={btnIcon} title="Delete">✕</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {folders.length > 0 && (
        <>
          <SectionLabel>Folders</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
            {folders.map(f => (
              <Card key={f.id} onClick={() => onSelectFolder(f.id)} onDelete={() => onDeleteFolder(f.id)}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>📁</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", wordBreak: "break-word", lineHeight: 1.4, marginBottom: 6 }}>{f.name}</div>
                <Badge tag={f.tag} />
                {isSearch && <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 6, lineHeight: 1.4 }}>{getPath(f.parentId || "")}</div>}
              </Card>
            ))}
          </div>
        </>
      )}
      {files.length > 0 && (
        <>
          <SectionLabel>Files</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {files.map(f => (
              <Card key={f.id} onDelete={() => onDeleteFile(f.id)}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{FILE_ICONS[f.type] || "📄"}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", wordBreak: "break-word", lineHeight: 1.4, marginBottom: 6 }}>{f.name}</div>
                {f.desc && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6, lineHeight: 1.4 }}>{f.desc.slice(0, 45)}{f.desc.length > 45 ? "…" : ""}</div>}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <Badge tag={f.tag} />
                  <StatusBadge status={f.status} />
                </div>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 5 }}>v{f.version}</div>
                {isSearch && <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 4, lineHeight: 1.4 }}>{getPath(f.folderId)}</div>}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ children, onClick, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--color-background-primary)",
        border: `0.5px solid ${hover ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`,
        borderRadius: 12, padding: "12px 12px 10px",
        cursor: onClick ? "pointer" : "default", position: "relative",
      }}
    >
      {children}
      {hover && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ ...btnIcon, position: "absolute", top: 7, right: 7 }}
          title="Delete"
        >✕</button>
      )}
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, ...style }}>
      {children}
    </div>
  );
}