"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateNoteForm from "./create-note-form";
import { useState } from "react";
import { PlusIcon, Upload } from "lucide-react";
import { btnIconStyles, btnStyles } from "@/styles/styles";
import { useToast } from "@/hooks/use-toast";


export default function CreateNoteButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast()
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
      <Button className={btnStyles}>
      <PlusIcon className={btnIconStyles} /> Create Note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
          <DialogDescription>
            Type your notes here.
          </DialogDescription>
          <CreateNoteForm onNoteCreated={() => {
            setIsOpen(false);
            toast({
              title: "Note created",
              description: "Your note has been created successfully",
            });
          } }/>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
