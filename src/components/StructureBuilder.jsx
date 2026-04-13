import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { getChapterById, getPartWordCount } from "../lib/manuscript";
import { getChapterWordCount } from "../lib/manuscript";

const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-60" : ""}
    >
      {children({ attributes, listeners })}
    </div>
  );
};

export function StructureBuilder({
  project,
  onAddPart,
  onRenamePart,
  onRemovePart,
  onAddChapter,
  onRenameChapter,
  onRemoveChapter,
  onMoveChapter,
  onOpenChapter,
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const chapterToPart = useMemo(() => {
    const map = {};
    project.parts.forEach((part) => {
      part.chapterIds.forEach((chapterId) => {
        map[chapterId] = part.id;
      });
    });
    return map;
  }, [project.parts]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink">Book Structure</h2>
          <p className="text-sm text-muted">
            Organize parts and chapters. Drag chapters between parts to adjust your manuscript flow.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPart}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Add part
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={({ active, over }) => {
          if (!over) return;
          const activeId = active.id;
          const overId = over.id;
          if (activeId === overId) return;

          const sourcePartId = chapterToPart[activeId];
          const targetPartId = chapterToPart[overId] || overId;
          const targetPart = project.parts.find((part) => part.id === targetPartId);
          if (!sourcePartId || !targetPart) return;
          const targetIndex = chapterToPart[overId]
            ? targetPart.chapterIds.indexOf(overId)
            : targetPart.chapterIds.length;

          onMoveChapter({
            chapterId: activeId,
            sourcePartId,
            targetPartId,
            targetIndex,
          });
        }}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {project.parts.map((part) => (
            <div key={part.id} className="rounded-3xl border border-line bg-panel p-5 shadow-panel">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <input
                    value={part.title}
                    onChange={(event) => onRenamePart(part.id, event.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 font-serif text-xl text-ink outline-none focus:border-accent"
                  />
                  <p className="mt-2 text-sm text-muted">
                    {part.chapterIds.length} chapters • {getPartWordCount(project, part).toLocaleString()} words
                  </p>
                </div>
                {project.parts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemovePart(part.id)}
                    className="rounded-xl border border-line p-2 text-muted hover:border-rose-300 hover:text-rose-600"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>

              <SortableContext items={part.chapterIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 rounded-2xl border border-dashed border-line bg-parchment/70 p-3">
                  {part.chapterIds.map((chapterId) => {
                    const chapter = getChapterById(project, chapterId);
                    if (!chapter) return null;

                    return (
                      <SortableItem key={chapter.id} id={chapter.id}>
                        {({ attributes, listeners }) => (
                          <div className="rounded-2xl border border-line bg-white p-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-lg border border-line p-2 text-muted"
                                {...attributes}
                                {...listeners}
                              >
                                <GripVertical size={16} />
                              </button>
                              <input
                                value={chapter.title}
                                onChange={(event) =>
                                  onRenameChapter(chapter.id, event.target.value)
                                }
                                onFocus={() => onOpenChapter(chapter.id)}
                                className="flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
                              />
                              <button
                                type="button"
                                onClick={() => onRemoveChapter(chapter.id)}
                                className="rounded-lg border border-line p-2 text-muted hover:border-rose-300 hover:text-rose-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-muted">
                              {getChapterWordCount(chapter).toLocaleString()} words
                            </p>
                          </div>
                        )}
                      </SortableItem>
                    );
                  })}
                </div>
              </SortableContext>

              <button
                type="button"
                onClick={() => onAddChapter(part.id)}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-accent"
              >
                <Plus size={16} />
                Add chapter
              </button>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
