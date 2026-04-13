import { buildPreviewSections, buildToc } from "./manuscript";
import { downloadBlob, getImageExtension, safeFileName, slugify } from "./utils";

const parseHtmlBlocks = (html = "") => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const nodes = [...doc.body.childNodes];

  return nodes.flatMap((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return [{ type: "p", text: node.textContent.trim() }];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const element = node;
    const tag = element.tagName.toLowerCase();
    if (tag === "img") {
      return [
        {
          type: "img",
          src: element.getAttribute("src"),
          alt: element.getAttribute("alt") || "",
        },
      ];
    }

    return [
      {
        type: tag,
        text: element.textContent || "",
      },
    ];
  });
};

const headingForTag = (tag, HeadingLevel) => {
  if (tag === "h1") return HeadingLevel.HEADING_1;
  if (tag === "h2") return HeadingLevel.HEADING_2;
  if (tag === "h3") return HeadingLevel.HEADING_3;
  return null;
};

const buildDocxParagraphs = async (section) => {
  const { HeadingLevel, ImageRun, Paragraph, TextRun } = await import("docx");
  const blocks = parseHtmlBlocks(section.content);
  const paragraphs = [];

  for (const block of blocks) {
    if (block.type === "img" && block.src?.startsWith("data:")) {
      const response = await fetch(block.src);
      const arrayBuffer = await response.arrayBuffer();
      paragraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: arrayBuffer,
              transformation: {
                width: 400,
                height: 260,
              },
            }),
          ],
        }),
      );
      continue;
    }

    paragraphs.push(
      new Paragraph({
        heading: headingForTag(block.type, HeadingLevel) || undefined,
        bullet: block.type === "li" ? { level: 0 } : undefined,
        children: [new TextRun(block.text)],
      }),
    );
  }

  return paragraphs;
};

export const exportDocx = async (project) => {
  const { Document, HeadingLevel, Packer, Paragraph } = await import("docx");
  const sections = buildPreviewSections(project);
  const paragraphs = [];

  for (const section of sections) {
    if (section.kind === "toc") {
      paragraphs.push(
        new Paragraph({ text: "Table of Contents", heading: HeadingLevel.HEADING_1 }),
      );
      buildToc(project).forEach((part) => {
        paragraphs.push(new Paragraph({ text: part.title, heading: HeadingLevel.HEADING_2 }));
        part.chapters.forEach((chapter) => {
          paragraphs.push(new Paragraph({ text: chapter.title }));
        });
      });
      continue;
    }

    paragraphs.push(
      new Paragraph({
        text: section.title,
        heading:
          section.kind === "chapter" || section.kind === "page"
            ? HeadingLevel.HEADING_1
            : HeadingLevel.HEADING_2,
      }),
    );
    paragraphs.push(...(await buildDocxParagraphs(section)));
  }

  const document = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, `${safeFileName(project.bookTitle)}.docx`);
};

export const exportPdf = async (project) => {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    unit: "pt",
    format: "letter",
  });
  const sections = buildPreviewSections(project);
  const margin = 56;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const writeWrapped = (text, size = 12, extraGap = 8) => {
    pdf.setFont("times", "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, usableWidth);
    lines.forEach((line) => {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += size + 4;
    });
    y += extraGap;
  };

  for (const section of sections) {
    pdf.setFont("times", "bold");
    pdf.setFontSize(20);
    if (y > pageHeight - margin * 1.5) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(section.title, margin, y);
    y += 28;

    if (section.kind === "toc") {
      buildToc(project).forEach((part) => {
        writeWrapped(part.title, 14, 4);
        part.chapters.forEach((chapter) => writeWrapped(chapter.title, 12, 2));
      });
      continue;
    }

    const blocks = parseHtmlBlocks(section.content);
    for (const block of blocks) {
      if (block.type === "img" && block.src?.startsWith("data:")) {
        if (y > pageHeight - 240) {
          pdf.addPage();
          y = margin;
        }
        const format = block.src.includes("image/png")
          ? "PNG"
          : block.src.includes("image/webp")
            ? "WEBP"
            : "JPEG";
        pdf.addImage(block.src, format, margin, y, usableWidth * 0.6, 180);
        y += 196;
      } else {
        const size = block.type === "h1" ? 16 : block.type === "h2" ? 14 : 12;
        writeWrapped(block.text, size, 10);
      }
    }
    y += 14;
  }

  pdf.save(`${safeFileName(project.bookTitle)}.pdf`);
};

const xhtmlDoc = (title, body) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
  <head>
    <title>${title}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: Georgia, serif; line-height: 1.6; margin: 0 auto; max-width: 42rem; padding: 2rem 1.5rem; }
      h1, h2, h3 { page-break-after: avoid; }
      img { max-width: 100%; height: auto; display: block; margin: 1rem auto; }
      blockquote { margin-left: 1rem; padding-left: 1rem; border-left: 3px solid #ccc; }
    </style>
  </head>
  <body>${body}</body>
</html>`;

export const exportEpub = async (project) => {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const toc = buildToc(project);
  const sections = buildPreviewSections(project);
  const safeTitle = safeFileName(project.bookTitle);
  const imagesFolder = zip.folder("OEBPS/images");
  const textFolder = zip.folder("OEBPS/text");

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.folder("META-INF").file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  project.images.forEach((image) => {
    const ext = getImageExtension(image.type);
    imagesFolder.file(`${image.id}.${ext}`, image.dataUrl.split(",")[1], { base64: true });
  });

  const manifestItems = [];
  const spineItems = [];
  const navEntries = [];

  sections.forEach((section, index) => {
    const id = `sec-${index + 1}`;
    const fileName = `${String(index + 1).padStart(2, "0")}-${slugify(section.title)}.xhtml`;
    let body = `<h1>${section.title}</h1>`;

    if (section.kind === "toc") {
      body += `<nav epub:type="toc" id="toc"><ol>${toc
        .map(
          (part) =>
            `<li>${part.title}<ol>${part.chapters
              .map((chapter) => `<li>${chapter.title}</li>`)
              .join("")}</ol></li>`,
        )
        .join("")}</ol></nav>`;
    } else {
      body += section.content;
    }

    project.images.forEach((image) => {
      const ext = getImageExtension(image.type);
      body = body.replaceAll(
        image.dataUrl,
        `../images/${image.id}.${ext}`,
      );
    });

    textFolder.file(fileName, xhtmlDoc(section.title, body));
    manifestItems.push(
      `<item id="${id}" href="text/${fileName}" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`<itemref idref="${id}"/>`);
    navEntries.push(`<li><a href="text/${fileName}">${section.title}</a></li>`);
  });

  manifestItems.push(
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
  );
  project.images.forEach((image) => {
    const ext = getImageExtension(image.type);
    const mimeType = image.type || "image/jpeg";
    manifestItems.push(
      `<item id="${image.id}" href="images/${image.id}.${ext}" media-type="${mimeType}"/>`,
    );
  });

  zip
    .folder("OEBPS")
    .file(
      "nav.xhtml",
      xhtmlDoc(
        "Navigation",
        `<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${navEntries.join("")}</ol></nav>`,
      ),
    )
    .file(
      "content.opf",
      `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${project.isbn || project.id}</dc:identifier>
    <dc:title>${project.bookTitle}</dc:title>
    <dc:creator>${project.authorName}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineItems.join("\n    ")}
  </spine>
</package>`,
    );

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${safeTitle}.epub`);
};
