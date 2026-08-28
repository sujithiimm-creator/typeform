"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Icons from "lucide-react";
import { GripVertical, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";
import { getQuestionModule } from "@/lib/questions/registry";

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

function SortableRow({
  question,
  index,
  active,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  question: Question;
  index: number;
  active: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const mod = getQuestionModule(question.type);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2 py-2 text-sm",
        active ? "border-primary bg-accent" : "border-transparent hover:bg-secondary",
        isDragging && "opacity-50"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground active:cursor-grabbing" aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <button onClick={onSelect} className="flex flex-1 items-center gap-2 truncate text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary text-xs text-muted-foreground">
          {index + 1}
        </span>
        <Icon name={mod.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{question.title || "Untitled question"}</span>
      </button>
      <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate} aria-label="Duplicate">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete} aria-label="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function QuestionList({
  questions,
  activeId,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
}: {
  questions: Question[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onReorder: (questions: Question[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ordered = [...questions].sort((a, b) => a.position - b.position);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((q) => q.id === active.id);
    const newIndex = ordered.findIndex((q) => q.id === over.id);
    const moved = arrayMove(ordered, oldIndex, newIndex).map((q, i) => ({ ...q, position: i }));
    onReorder(moved);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ordered.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1">
          {ordered.map((q, i) => (
            <SortableRow
              key={q.id}
              question={q}
              index={i}
              active={q.id === activeId}
              onSelect={() => onSelect(q.id)}
              onDuplicate={() => onDuplicate(q.id)}
              onDelete={() => onDelete(q.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
