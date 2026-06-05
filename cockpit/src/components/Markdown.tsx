import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Render a markdown string with GFM (tables, lists, strikethrough), styled via Tailwind typography. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm min-w-0 max-w-none break-words dark:prose-invert prose-headings:mb-1 prose-headings:mt-3 prose-headings:font-semibold prose-p:my-1.5 prose-li:my-0.5 prose-pre:overflow-x-auto prose-pre:bg-muted prose-pre:text-foreground prose-table:block prose-table:overflow-x-auto prose-table:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
