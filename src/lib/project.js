import { chapterLabel, nowIso, partLabel, uid } from "./utils";

export const FRONT_MATTER_TYPES = [
  { key: "dedication", label: "Dedication" },
  { key: "epigraph", label: "Epigraph" },
  { key: "foreword", label: "Foreword" },
  { key: "preface", label: "Preface" },
];

export const END_MATTER_TYPES = [
  { key: "acknowledgements", label: "Acknowledgements" },
  { key: "about-author", label: "About the Author" },
];

const createFrontMatter = () =>
  FRONT_MATTER_TYPES.map((section) => ({
    id: uid("front"),
    type: section.key,
    title: section.label,
    content: "",
  }));

const createEndMatter = () =>
  END_MATTER_TYPES.map((section) => ({
    id: uid("end"),
    type: section.key,
    title: section.label,
    content: "",
  }));

const createChapter = (partId, index = 0) => ({
  id: uid("chapter"),
  partId,
  title: chapterLabel(index),
  content: `<h1>${chapterLabel(index)}</h1><p></p>`,
});

export const createProject = () => {
  const firstPartId = uid("part");
  const chapter = createChapter(firstPartId, 0);
  const timestamp = nowIso();

  return {
    id: uid("project"),
    bookTitle: "Untitled Manuscript",
    subtitle: "",
    authorName: "",
    publisherName: "",
    copyrightYear: new Date().getFullYear().toString(),
    copyrightHolder: "",
    edition: "First Edition",
    isbn: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    frontMatter: createFrontMatter(),
    parts: [
      {
        id: firstPartId,
        title: partLabel(0),
        chapterIds: [chapter.id],
      },
    ],
    chapters: [chapter],
    endMatter: createEndMatter(),
    images: [],
    activeNode: {
      type: "chapter",
      id: chapter.id,
    },
  };
};

export const buildStaticPages = (project) => {
  const titlePage = {
    id: "title-page",
    title: "Title Page",
    content: `<h1>${project.bookTitle || "Untitled Manuscript"}</h1>${
      project.subtitle ? `<h2>${project.subtitle}</h2>` : ""
    }<p>${project.authorName || ""}</p>`,
  };
  const copyrightPage = {
    id: "copyright-page",
    title: "Copyright Page",
    content: `<p>Copyright ${project.copyrightYear || ""} ${
      project.copyrightHolder || project.authorName || ""
    }</p><p>${project.publisherName || ""}</p><p>${project.edition || ""}</p>${
      project.isbn ? `<p>ISBN ${project.isbn}</p>` : ""
    }`,
  };

  return { titlePage, copyrightPage };
};

export const getProjectSummary = (project) => {
  const totalWords = project.chapters.reduce((sum, chapter) => {
    const text = chapter.content.replace(/<[^>]*>/g, " ").trim();
    return sum + (text ? text.split(/\s+/).length : 0);
  }, 0);

  return {
    id: project.id,
    bookTitle: project.bookTitle,
    authorName: project.authorName,
    totalWords,
    chapters: project.chapters.length,
    updatedAt: project.updatedAt,
  };
};

export const getNodeTitle = (project, node) => {
  if (!node) return "";
  if (node.type === "chapter") {
    return project.chapters.find((chapter) => chapter.id === node.id)?.title || "";
  }
  if (node.type === "frontMatter") {
    return project.frontMatter.find((section) => section.id === node.id)?.title || "";
  }
  if (node.type === "endMatter") {
    return project.endMatter.find((section) => section.id === node.id)?.title || "";
  }
  if (node.type === "staticPage") {
    return node.id === "title-page" ? "Title Page" : "Copyright Page";
  }
  return "";
};
