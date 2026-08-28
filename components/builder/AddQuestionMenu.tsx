"use client";

import * as Icons from "lucide-react";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { questionTypeList } from "@/lib/questions/registry";
import type { QuestionType } from "@/lib/types";

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

export function AddQuestionMenu({ onAdd }: { onAdd: (type: QuestionType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="w-full">
          <Plus className="h-4 w-4" /> Add question
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {questionTypeList.map((mod) => (
          <DropdownMenuItem key={mod.type} onClick={() => onAdd(mod.type)} className="flex items-start gap-2 py-2">
            <Icon name={mod.icon} className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{mod.label}</span>
              <span className="text-xs text-muted-foreground">{mod.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
