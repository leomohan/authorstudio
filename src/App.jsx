import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Eye,
  FileArchive,
  FolderOpen,
  Image as ImageIcon,
  Library,
  Save,
  Upload,
  WandSparkles,
} from "lucide-react";
import { RichTextEditor } from "./components/RichTextEditor";
import { StructureBuilder } from "./components/StructureBuilder";
import { FrontMatterSorter } from "./components/FrontMatterSorter";
import { ImageManager } from "./components/ImageManager";
import { projectRepository } from "./lib/db";
import { exportDocx, exportEpub, exportPdf } from "./lib/exporters";
import {
  buildStaticPages,
  getNodeTitle,
  getProjectSummary,
} from "./lib/project";
import {
  buildPreviewSections,
  buildToc,
  getChapterById,
  getPartWordCount,
  getTotalWordCount,
} from "./lib/manuscript";
import { validateProject } from "./lib/validation";
import {
  countWords,
  downloadBlob,
  fileToDataUrl,
  formatDateTime,
  safeFileName,
  uid,
} from "./lib/utils";
import { useAuthorStudioStore } from "./store/useAuthorStudioStore";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: FolderOpen },
  { key: "builder", label: "Builder", icon: WandSparkles },
  { key: "writing", label: "Writing", icon: BookOpen },
  { key: "preview", label: "Preview", icon: Eye },
  { key: "exports", label: "Export", icon: FileArchive },
  { key: "images", label: "Images", icon: ImageIcon },
];

const NavButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? "bg-accent text-white" : "bg-white/80 text-muted hover:text-accent"
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const SectionCard = ({ title, description, children }) => (
  <section className="rounded-[2rem] border border-line bg-panel p-6 shadow-panel">
    <div className="mb-5">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <p className="text-sm text-muted">{description}</p>
    </div>
    {children}
  </section>
);

function Dashboard({
  projects,
  onCreate,
  onOpen,
  onDelete,
  onImport,
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-line bg-vellum p-8 shadow-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">
              Local-first manuscript studio
            </p>
            <h1 className="font-serif text-5xl leading-tight text-ink">
              Author Studio
            </h1>
            <p className="text-lg leading-8 text-muted">
              Structure, write, preview, validate, and export publishing-safe manuscripts for Reedsy, EPUB, Amazon KDP, and Draft2Digital.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCreate}
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              <Upload size={16} />
              Import Project JSON
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const [file] = event.target.files || [];
            if (!file) return;
            const contents = JSON.parse(await file.text());
            onImport(contents);
            event.target.value = "";
          }}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {projects.length ? (
          projects.map((project) => {
            const summary = getProjectSummary(project);
            return (
              <article
                key={project.id}
                className="rounded-[2rem] border border-line bg-panel p-6 shadow-panel"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    <Library size={14} />
                    Manuscript
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl text-ink">{summary.bookTitle}</h2>
                    <p className="text-sm text-muted">{summary.authorName || "Unknown author"}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white p-3">
                      <dt className="text-muted">Words</dt>
                      <dd className="mt-1 font-semibold text-ink">
                        {summary.totalWords.toLocaleString()}
                      </dd>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <dt className="text-muted">Chapters</dt>
                      <dd className="mt-1 font-semibold text-ink">{summary.chapters}</dd>
                    </div>
                    <div className="col-span-2 rounded-2xl bg-white p-3">
                      <dt className="text-muted">Last edited</dt>
                      <dd className="mt-1 font-semibold text-ink">
                        {formatDateTime(summary.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onOpen(project)}
                      className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open Project
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(project.id)}
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[2rem] border border-dashed border-line bg-panel p-8 text-center text-muted">
            No local projects yet. Create your first manuscript to begin.
          </div>
        )}
      </div>
    </div>
  );
}

function BuilderPage({ project, actions }) {
  const activeFrontMatter = project.frontMatter.find(
    (section) => project.activeNode?.type === "frontMatter" && section.id === project.activeNode.id,
  );
  const activeEndMatter = project.endMatter.find(
    (section) => project.activeNode?.type === "endMatter" && section.id === project.activeNode.id,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-6">
        <SectionCard
          title="Step 1 — Book Metadata"
          description="This metadata drives title page generation, copyright page details, and export package information."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["bookTitle", "Book Title"],
              ["subtitle", "Subtitle"],
              ["authorName", "Author Name"],
              ["publisherName", "Publisher Name"],
              ["copyrightYear", "Copyright Year"],
              ["copyrightHolder", "Copyright Holder"],
              ["edition", "Edition"],
              ["isbn", "ISBN (optional)"],
            ].map(([field, label]) => (
              <label key={field} className="space-y-2 text-sm font-medium text-ink">
                <span>{label}</span>
                <input
                  value={project[field]}
                  onChange={(event) => actions.updateMetadata(field, event.target.value)}
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-accent"
                />
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Step 2 — Front Matter"
          description="Reorder the opening sections, then edit them in the side panel."
        >
          <FrontMatterSorter
            sections={project.frontMatter}
            onRename={(id, title) => actions.renameSection("frontMatter", id, title)}
            onOpen={(id) => actions.setActiveNode("frontMatter", id)}
            onReorder={actions.reorderFrontMatter}
          />
        </SectionCard>

        <SectionCard
          title="Step 3 — Structure Builder"
          description="Build parts and chapters, then drag chapters into the right place."
        >
          <StructureBuilder
            project={project}
            onAddPart={actions.addPart}
            onRenamePart={actions.renamePart}
            onRemovePart={actions.removePart}
            onAddChapter={actions.addChapter}
            onRenameChapter={actions.renameChapter}
            onRemoveChapter={actions.removeChapter}
            onMoveChapter={actions.moveChapter}
            onOpenChapter={(id) => actions.setActiveNode("chapter", id)}
          />
        </SectionCard>
      </div>

      <div className="space-y-6">
        <SectionCard
          title="Generated Pages"
          description="Title and copyright pages update automatically from the metadata above."
        >
          <div className="space-y-4">
            {Object.values(buildStaticPages(project)).map((page) => (
              <div key={page.id} className="rounded-2xl border border-line bg-white p-4">
                <h3 className="font-serif text-xl text-ink">{page.title}</h3>
                <div
                  className="prose prose-stone mt-3 max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Step 4 — Matter Editor"
          description="Edit front matter and end matter without leaving the setup flow."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {project.frontMatter.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => actions.setActiveNode("frontMatter", section.id)}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  project.activeNode?.id === section.id
                    ? "bg-accent text-white"
                    : "bg-white text-muted"
                }`}
              >
                {section.title}
              </button>
            ))}
            {project.endMatter.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => actions.setActiveNode("endMatter", section.id)}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  project.activeNode?.id === section.id
                    ? "bg-accent text-white"
                    : "bg-white text-muted"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          {activeFrontMatter || activeEndMatter ? (
            <RichTextEditor
              value={(activeFrontMatter || activeEndMatter).content}
              onChange={(content) =>
                actions.updateSectionContent(
                  activeFrontMatter ? "frontMatter" : "endMatter",
                  (activeFrontMatter || activeEndMatter).id,
                  content,
                )
              }
              onSave={actions.manualSave}
              onInsertImage={actions.insertImage}
              placeholder="Use this editor for dedication, epigraph, foreword, preface, acknowledgements, and author bio content."
            />
          ) : (
            <p className="text-sm text-muted">
              Select a front or end matter section to begin editing.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function WritingPage({ project, actions }) {
  const activeChapter =
    project.activeNode?.type === "chapter"
      ? getChapterById(project, project.activeNode.id)
      : project.chapters[0];
  const chapterPart = project.parts.find((part) => part.id === activeChapter?.partId);

  return (
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="rounded-[2rem] border border-line bg-panel p-4 shadow-panel">
        <h2 className="mb-4 font-serif text-2xl text-ink">Manuscript</h2>
        <div className="space-y-4">
          {project.parts.map((part) => (
            <div key={part.id}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                  {part.title}
                </h3>
                <span className="text-xs text-muted">
                  {getPartWordCount(project, part).toLocaleString()} words
                </span>
              </div>
              <div className="space-y-2">
                {part.chapterIds.map((chapterId) => {
                  const chapter = getChapterById(project, chapterId);
                  if (!chapter) return null;
                  const active = activeChapter?.id === chapter.id;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => actions.setActiveNode("chapter", chapter.id)}
                      className={`block w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                        active
                          ? "bg-accent text-white"
                          : "bg-white text-ink hover:text-accent"
                      }`}
                    >
                      <div className="font-semibold">{chapter.title}</div>
                      <div className={`${active ? "text-white/80" : "text-muted"}`}>
                        {countWords(chapter.content).toLocaleString()} words
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-line bg-panel px-5 py-4 shadow-panel">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-gold">
              {chapterPart?.title || "Draft"}
            </div>
            <h1 className="font-serif text-3xl text-ink">{activeChapter?.title}</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <span>{countWords(activeChapter?.content || "").toLocaleString()} chapter words</span>
            <span>{getTotalWordCount(project).toLocaleString()} total words</span>
          </div>
        </div>

        {activeChapter ? (
          <RichTextEditor
            value={activeChapter.content}
            onChange={(content) => actions.updateChapterContent(activeChapter.id, content)}
            onSave={actions.manualSave}
            onInsertImage={actions.insertImage}
            placeholder="EPUB-safe formatting only: headings, emphasis, lists, quotes, superscript, subscript, and images."
          />
        ) : null}
      </div>
    </div>
  );
}

function PreviewPage({ project }) {
  const sections = buildPreviewSections(project);
  const toc = buildToc(project);

  return (
    <div className="mx-auto max-w-4xl space-y-8 rounded-[2rem] border border-line bg-panel p-8 shadow-panel">
      <div className="border-b border-line pb-6 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">EPUB Preview</p>
        <h1 className="mt-2 font-serif text-5xl text-ink">{project.bookTitle}</h1>
        <p className="mt-2 text-muted">{project.authorName}</p>
      </div>

      {sections.map((section, index) => (
        <article key={`${section.kind}-${index}`} className="prose prose-stone max-w-none font-serif">
          <h1>{section.title}</h1>
          {section.kind === "toc" ? (
            <ol>
              {toc.map((part) => (
                <li key={part.id}>
                  {part.title}
                  <ol>
                    {part.chapters.map((chapter) => (
                      <li key={chapter.id}>{chapter.title}</li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          )}
        </article>
      ))}
    </div>
  );
}

function ExportPage({ project, onExportProjectJson }) {
  const issues = useMemo(() => validateProject(project), [project]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        title="Export Validation"
        description="A quick EPUB safety check before generating files."
      >
        <div className="space-y-3">
          {issues.length ? (
            issues.map((issue, index) => (
              <div
                key={`${issue.scope}-${index}`}
                className={`rounded-2xl border p-4 ${
                  issue.severity === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.14em]">
                  {issue.scope}
                </div>
                <p className="mt-1 text-sm">{issue.message}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              No validation issues detected. The manuscript structure is export-ready.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Export Panel"
        description="Generate portable files or download a full local project backup."
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => exportDocx(project)}
            className="w-full rounded-2xl bg-accent px-5 py-4 text-left text-sm font-semibold text-white"
          >
            Export DOCX
          </button>
          <button
            type="button"
            onClick={() => exportEpub(project)}
            className="w-full rounded-2xl bg-gold px-5 py-4 text-left text-sm font-semibold text-white"
          >
            Export EPUB
          </button>
          <button
            type="button"
            onClick={() => exportPdf(project)}
            className="w-full rounded-2xl border border-line bg-white px-5 py-4 text-left text-sm font-semibold text-ink"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={onExportProjectJson}
            className="w-full rounded-2xl border border-line bg-white px-5 py-4 text-left text-sm font-semibold text-ink"
          >
            Download Project JSON Backup
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

export default function App() {
  const {
    projects,
    activeProject,
    currentPage,
    dirty,
    setProjects,
    setCurrentPage,
    createNewProject,
    openProject,
    closeProject,
    replaceProject,
    updateMetadata,
    setActiveNode,
    updateSectionContent,
    renameSection,
    reorderFrontMatter,
    addPart,
    renamePart,
    removePart,
    addChapter,
    renameChapter,
    updateChapterContent,
    removeChapter,
    moveChapter,
    registerImage,
    updateImage,
    deleteImage,
    markSaved,
  } = useAuthorStudioStore();
  const [saveState, setSaveState] = useState("Idle");

  useEffect(() => {
    projectRepository.list().then(setProjects);
  }, [setProjects]);

  useEffect(() => {
    if (!activeProject || !dirty) return undefined;

    setSaveState("Autosaving...");
    const timeout = window.setTimeout(async () => {
      await projectRepository.save(activeProject);
      setSaveState(`Saved ${formatDateTime(new Date().toISOString())}`);
      markSaved();
      setProjects(await projectRepository.list());
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [activeProject, dirty, markSaved, setProjects]);

  const manualSave = async () => {
    if (!activeProject) return;
    await projectRepository.save(activeProject);
    markSaved();
    setProjects(await projectRepository.list());
    setSaveState(`Saved ${formatDateTime(new Date().toISOString())}`);
  };

  const exportProjectJson = () => {
    if (!activeProject) return;
    const blob = new Blob([JSON.stringify(activeProject, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, `${safeFileName(activeProject.bookTitle)}.author-studio.json`);
  };

  const insertImage = async (file) => {
    const dataUrl = await fileToDataUrl(file);
    const image = {
      id: uid("image"),
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl,
    };
    registerImage(image);
    return image;
  };

  const actions = {
    updateMetadata,
    setActiveNode,
    updateSectionContent,
    renameSection,
    reorderFrontMatter,
    addPart,
    renamePart,
    removePart,
    addChapter,
    renameChapter,
    updateChapterContent,
    removeChapter,
    moveChapter,
    manualSave,
    insertImage,
  };

  return (
    <div className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[92rem] space-y-6">
        <header className="rounded-[2rem] border border-line bg-vellum px-6 py-5 shadow-panel">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-gold">
                Author Studio
              </div>
              <h1 className="font-serif text-4xl text-ink">
                {activeProject?.bookTitle || "Local-first manuscript workflow"}
              </h1>
              <p className="text-sm text-muted">
                {activeProject
                  ? `${getNodeTitle(activeProject, activeProject.activeNode) || "Builder"} • ${getTotalWordCount(activeProject).toLocaleString()} words`
                  : "Browser-only book planning, writing, previewing, and exports."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activeProject ? (
                <>
                  {navItems.map((item) => (
                    <NavButton
                      key={item.key}
                      active={currentPage === item.key}
                      icon={item.icon}
                      label={item.label}
                      onClick={() => setCurrentPage(item.key)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={manualSave}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={closeProject}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
                  >
                    Back to Dashboard
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {activeProject ? (
          <div className="flex items-center justify-between rounded-[2rem] border border-line bg-panel px-5 py-4 shadow-panel">
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <span>{getTotalWordCount(activeProject).toLocaleString()} total words</span>
              <span>{activeProject.chapters.length} chapters</span>
              <span>{activeProject.images.length} images</span>
              <span>{formatDateTime(activeProject.updatedAt)}</span>
            </div>
            <div className="text-sm font-semibold text-accent">{saveState}</div>
          </div>
        ) : null}

        {!activeProject || currentPage === "dashboard" ? (
          <Dashboard
            projects={projects}
            onCreate={createNewProject}
            onOpen={openProject}
            onDelete={async (id) => {
              await projectRepository.delete(id);
              setProjects(await projectRepository.list());
            }}
            onImport={async (project) => {
              await projectRepository.save(project);
              setProjects(await projectRepository.list());
              openProject(project);
            }}
          />
        ) : null}

        {activeProject && currentPage === "builder" ? (
          <BuilderPage project={activeProject} actions={actions} />
        ) : null}

        {activeProject && currentPage === "writing" ? (
          <WritingPage project={activeProject} actions={actions} />
        ) : null}

        {activeProject && currentPage === "preview" ? <PreviewPage project={activeProject} /> : null}

        {activeProject && currentPage === "exports" ? (
          <ExportPage project={activeProject} onExportProjectJson={exportProjectJson} />
        ) : null}

        {activeProject && currentPage === "images" ? (
          <ImageManager
            project={activeProject}
            onRename={updateImage}
            onDelete={deleteImage}
            onOpenChapter={(chapterId) => {
              setActiveNode("chapter", chapterId);
              setCurrentPage("writing");
            }}
          />
        ) : null}

        <footer className="rounded-[2rem] border border-line bg-panel px-6 py-5 text-sm text-muted shadow-panel">
          Built for browser-only drafting today, with a future-ready architecture for AI outline, rewrite, and editorial assistants later.
        </footer>
      </div>
    </div>
  );
}
