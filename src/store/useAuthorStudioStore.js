import { create } from "zustand";
import { createProject } from "../lib/project";
import { getPartById } from "../lib/manuscript";
import { moveItem, nowIso, uid } from "../lib/utils";

const updateTimestamp = (project) => ({ ...project, updatedAt: nowIso() });

const moveChapterBetweenParts = (project, chapterId, sourcePartId, targetPartId, targetIndex) => {
  const parts = project.parts.map((part) => ({
    ...part,
    chapterIds: [...part.chapterIds],
  }));
  const source = parts.find((part) => part.id === sourcePartId);
  const target = parts.find((part) => part.id === targetPartId);
  if (!source || !target) return project;

  source.chapterIds = source.chapterIds.filter((id) => id !== chapterId);
  target.chapterIds.splice(targetIndex, 0, chapterId);

  return {
    ...project,
    parts,
    chapters: project.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, partId: targetPartId } : chapter,
    ),
  };
};

export const useAuthorStudioStore = create((set) => ({
  projects: [],
  activeProject: null,
  currentPage: "dashboard",
  dirty: false,
  setProjects: (projects) => set({ projects }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  createNewProject: () =>
    set({
      activeProject: createProject(),
      currentPage: "builder",
      dirty: true,
    }),
  openProject: (project) =>
    set({
      activeProject: project,
      currentPage: "builder",
      dirty: false,
    }),
  closeProject: () => set({ activeProject: null, currentPage: "dashboard", dirty: false }),
  replaceProject: (project) =>
    set({
      activeProject: project,
      currentPage: "builder",
      dirty: true,
    }),
  patchProject: (updater) =>
    set((state) => {
      if (!state.activeProject) return state;
      const nextProject = updateTimestamp(updater(state.activeProject));
      return {
        activeProject: nextProject,
        dirty: true,
      };
    }),
  updateMetadata: (field, value) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          [field]: value,
        }),
        dirty: true,
      };
    }),
  setActiveNode: (type, id) =>
    set((state) => ({
      activeProject: state.activeProject
        ? {
            ...state.activeProject,
            activeNode: { type, id },
          }
        : null,
    })),
  updateSectionContent: (collection, id, content) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          [collection]: state.activeProject[collection].map((item) =>
            item.id === id ? { ...item, content } : item,
          ),
        }),
        dirty: true,
      };
    }),
  renameSection: (collection, id, title) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          [collection]: state.activeProject[collection].map((item) =>
            item.id === id ? { ...item, title } : item,
          ),
        }),
        dirty: true,
      };
    }),
  reorderFrontMatter: (activeId, overId) =>
    set((state) => {
      if (!state.activeProject || !overId || activeId === overId) return state;
      const fromIndex = state.activeProject.frontMatter.findIndex((item) => item.id === activeId);
      const toIndex = state.activeProject.frontMatter.findIndex((item) => item.id === overId);
      if (fromIndex === -1 || toIndex === -1) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          frontMatter: moveItem(state.activeProject.frontMatter, fromIndex, toIndex),
        }),
        dirty: true,
      };
    }),
  addPart: () =>
    set((state) => {
      if (!state.activeProject) return state;
      const id = uid("part");
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          parts: [
            ...state.activeProject.parts,
            {
              id,
              title: `Part ${state.activeProject.parts.length + 1}`,
              chapterIds: [],
            },
          ],
        }),
        dirty: true,
      };
    }),
  renamePart: (partId, title) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          parts: state.activeProject.parts.map((part) =>
            part.id === partId ? { ...part, title } : part,
          ),
        }),
        dirty: true,
      };
    }),
  removePart: (partId) =>
    set((state) => {
      if (!state.activeProject) return state;
      const part = getPartById(state.activeProject, partId);
      if (!part) return state;
      const fallbackPart = state.activeProject.parts.find((item) => item.id !== partId);
      if (!fallbackPart) return state;
      const parts = state.activeProject.parts
        .filter((item) => item.id !== partId)
        .map((item) =>
          item.id === fallbackPart.id
            ? { ...item, chapterIds: [...item.chapterIds, ...part.chapterIds] }
            : item,
        );
      const chapters = state.activeProject.chapters.map((chapter) =>
        chapter.partId === partId ? { ...chapter, partId: fallbackPart.id } : chapter,
      );
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          parts,
          chapters,
        }),
        dirty: true,
      };
    }),
  addChapter: (partId) =>
    set((state) => {
      if (!state.activeProject) return state;
      const chapterId = uid("chapter");
      const title = `Chapter ${state.activeProject.chapters.length + 1}`;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          chapters: [
            ...state.activeProject.chapters,
            {
              id: chapterId,
              partId,
              title,
              content: `<h1>${title}</h1><p></p>`,
            },
          ],
          parts: state.activeProject.parts.map((part) =>
            part.id === partId
              ? { ...part, chapterIds: [...part.chapterIds, chapterId] }
              : part,
          ),
          activeNode: { type: "chapter", id: chapterId },
        }),
        dirty: true,
      };
    }),
  renameChapter: (chapterId, title) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          chapters: state.activeProject.chapters.map((chapter) =>
            chapter.id === chapterId ? { ...chapter, title } : chapter,
          ),
        }),
        dirty: true,
      };
    }),
  updateChapterContent: (chapterId, content) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          chapters: state.activeProject.chapters.map((chapter) =>
            chapter.id === chapterId ? { ...chapter, content } : chapter,
          ),
        }),
        dirty: true,
      };
    }),
  removeChapter: (chapterId) =>
    set((state) => {
      if (!state.activeProject || state.activeProject.chapters.length === 1) return state;
      const chapter = state.activeProject.chapters.find((item) => item.id === chapterId);
      if (!chapter) return state;
      const nextChapters = state.activeProject.chapters.filter((item) => item.id !== chapterId);
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          chapters: nextChapters,
          parts: state.activeProject.parts.map((part) =>
            part.id === chapter.partId
              ? { ...part, chapterIds: part.chapterIds.filter((id) => id !== chapterId) }
              : part,
          ),
          activeNode: { type: "chapter", id: nextChapters[0].id },
        }),
        dirty: true,
      };
    }),
  moveChapter: ({ chapterId, sourcePartId, targetPartId, targetIndex }) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp(
          moveChapterBetweenParts(
            state.activeProject,
            chapterId,
            sourcePartId,
            targetPartId,
            targetIndex,
          ),
        ),
        dirty: true,
      };
    }),
  registerImage: (image) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          images: [...state.activeProject.images, image],
        }),
        dirty: true,
      };
    }),
  updateImage: (imageId, updates) =>
    set((state) => {
      if (!state.activeProject) return state;
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          images: state.activeProject.images.map((image) =>
            image.id === imageId ? { ...image, ...updates } : image,
          ),
        }),
        dirty: true,
      };
    }),
  deleteImage: (imageId) =>
    set((state) => {
      if (!state.activeProject) return state;
      const cleanedChapters = state.activeProject.chapters.map((chapter) => ({
        ...chapter,
        content: chapter.content.replace(
          new RegExp(`<img[^>]*data-image-id="${imageId}"[^>]*>`, "g"),
          "",
        ),
      }));
      return {
        activeProject: updateTimestamp({
          ...state.activeProject,
          images: state.activeProject.images.filter((image) => image.id !== imageId),
          chapters: cleanedChapters,
        }),
        dirty: true,
      };
    }),
  markSaved: () => set({ dirty: false }),
}));
