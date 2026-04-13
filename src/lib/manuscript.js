import { buildStaticPages } from "./project";
import { countWords, stripHtml } from "./utils";

export const getPartById = (project, partId) =>
  project.parts.find((part) => part.id === partId);

export const getChapterById = (project, chapterId) =>
  project.chapters.find((chapter) => chapter.id === chapterId);

export const getChapterWordCount = (chapter) => countWords(chapter.content);

export const getPartWordCount = (project, part) =>
  part.chapterIds.reduce((sum, chapterId) => {
    const chapter = getChapterById(project, chapterId);
    return sum + (chapter ? getChapterWordCount(chapter) : 0);
  }, 0);

export const getTotalWordCount = (project) =>
  project.chapters.reduce((sum, chapter) => sum + getChapterWordCount(chapter), 0);

export const buildToc = (project) =>
  project.parts.map((part) => ({
    id: part.id,
    title: part.title,
    chapters: part.chapterIds
      .map((chapterId) => getChapterById(project, chapterId))
      .filter(Boolean)
      .map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
      })),
  }));

export const buildPreviewSections = (project) => {
  const staticPages = buildStaticPages(project);
  const sections = [
    {
      kind: "page",
      title: staticPages.titlePage.title,
      content: staticPages.titlePage.content,
    },
    {
      kind: "page",
      title: staticPages.copyrightPage.title,
      content: staticPages.copyrightPage.content,
    },
    ...project.frontMatter
      .filter((section) => stripHtml(section.content).trim())
      .map((section) => ({
        kind: "frontMatter",
        title: section.title,
        content: section.content,
      })),
    {
      kind: "toc",
      title: "Table of Contents",
      toc: buildToc(project),
    },
  ];

  project.parts.forEach((part) => {
    sections.push({
      kind: "part",
      title: part.title,
      content: "",
    });
    part.chapterIds.forEach((chapterId) => {
      const chapter = getChapterById(project, chapterId);
      if (chapter) {
        sections.push({
          kind: "chapter",
          title: chapter.title,
          content: chapter.content,
        });
      }
    });
  });

  sections.push(
    ...project.endMatter
      .filter((section) => stripHtml(section.content).trim())
      .map((section) => ({
        kind: "endMatter",
        title: section.title,
        content: section.content,
      })),
  );

  return sections;
};
