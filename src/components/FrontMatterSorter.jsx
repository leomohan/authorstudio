import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

const SortableSection = ({ section, onRename, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3"
    >
      <button
        type="button"
        className="rounded-lg border border-line p-2 text-muted"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <input
        value={section.title}
        onChange={(event) => onRename(section.id, event.target.value)}
        onFocus={() => onOpen(section.id)}
        className="flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
};

export function FrontMatterSorter({ sections, onRename, onOpen, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over) onReorder(active.id, over.id);
      }}
    >
      <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              onRename={onRename}
              onOpen={onOpen}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
