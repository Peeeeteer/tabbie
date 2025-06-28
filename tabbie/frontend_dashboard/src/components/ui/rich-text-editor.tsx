"use client"

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Add a description...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3',
      },
    },
  });

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border border-gray-300 rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500", className)}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bold') ? 'bg-gray-200' : ''
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('italic') ? 'bg-gray-200' : ''
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bulletList') ? 'bg-gray-200' : ''
          )}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('orderedList') ? 'bg-gray-200' : ''
          )}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('link') ? 'bg-gray-200' : ''
          )}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <div className="min-h-[120px] relative">
        <EditorContent 
          editor={editor} 
          className="prose-sm"
        />
        {editor.isEmpty && (
          <div className="absolute top-3 left-3 text-gray-400 pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
} 