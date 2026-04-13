import { Image as ImageIcon, Trash2 } from "lucide-react";

export function ImageManager({ project, onRename, onDelete, onOpenChapter }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">Image Manager</h2>
        <p className="text-sm text-muted">
          Review embedded assets before export. Images are stored locally and included in EPUB and DOCX.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {project.images.length ? (
          project.images.map((image) => {
            const chapter = project.chapters.find((item) =>
              item.content.includes(`data-image-id="${image.id}"`),
            );

            return (
              <div key={image.id} className="rounded-3xl border border-line bg-panel p-4 shadow-panel">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white">
                  <img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" />
                </div>
                <div className="mt-4 space-y-3">
                  <input
                    value={image.name}
                    onChange={(event) => onRename(image.id, { name: event.target.value })}
                    className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <div className="text-sm text-muted">
                    <div>{Math.round(image.size / 1024)} KB</div>
                    <button
                      type="button"
                      onClick={() => chapter && onOpenChapter(chapter.id)}
                      className="text-accent hover:text-emerald-800"
                    >
                      Used in: {chapter?.title || "Not used"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(image.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    <Trash2 size={16} />
                    Delete image
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-panel p-8 text-center text-muted">
            <ImageIcon className="mx-auto mb-3" size={28} />
            No images yet. Insert one from the chapter editor and it will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
