const allowedTags = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "strong",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "sup",
  "sub",
  "img",
  "br",
]);

export const validateProject = (project) => {
  const issues = [];

  project.chapters.forEach((chapter) => {
    const doc = new DOMParser().parseFromString(chapter.content, "text/html");
    const tags = [...doc.body.querySelectorAll("*")];
    let previousHeadingLevel = 1;

    tags.forEach((element) => {
      const tagName = element.tagName.toLowerCase();

      if (!allowedTags.has(tagName)) {
        issues.push({
          severity: "warning",
          scope: chapter.title,
          message: `Unsupported formatting detected: <${tagName}>.`,
        });
      }

      if (/^h[1-3]$/.test(tagName)) {
        const level = Number(tagName[1]);
        if (level - previousHeadingLevel > 1) {
          issues.push({
            severity: "warning",
            scope: chapter.title,
            message: `Heading hierarchy jumps from H${previousHeadingLevel} to H${level}.`,
          });
        }
        previousHeadingLevel = level;
      }

      if (tagName === "img") {
        const src = element.getAttribute("src") || "";
        const image = project.images.find((item) => item.id === element.getAttribute("data-image-id"));
        if (!src.startsWith("data:")) {
          issues.push({
            severity: "error",
            scope: chapter.title,
            message: "Image source is not embedded as a local asset.",
          });
        }
        if (image && image.size > 4 * 1024 * 1024) {
          issues.push({
            severity: "warning",
            scope: chapter.title,
            message: `${image.name} is larger than 4MB and may cause EPUB upload issues.`,
          });
        }
      }

      if (tagName === "a") {
        issues.push({
          severity: "warning",
          scope: chapter.title,
          message: "Internal or external links are not preserved in V1 exports.",
        });
      }
    });
  });

  if (!project.bookTitle.trim()) {
    issues.push({
      severity: "error",
      scope: "Metadata",
      message: "Book title is required.",
    });
  }

  if (!project.authorName.trim()) {
    issues.push({
      severity: "warning",
      scope: "Metadata",
      message: "Author name is blank.",
    });
  }

  return issues;
};
