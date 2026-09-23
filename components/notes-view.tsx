"use client";

import ReactMarkdown from "react-markdown";

export function NotesView({ notes }: { notes: string }) {
  if (!notes.trim()) {
    return <p className="text-muted-foreground">No notes for this session.</p>;
  }

  return (
    <div className="prose prose-invert max-w-none text-base leading-relaxed prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          ),
        }}
      >
        {notes}
      </ReactMarkdown>
    </div>
  );
}
