import { Avatar } from "@/components/ui/avatar";
import { FileChip } from "@/components/ui/file-chip";
import { cn } from "@/lib/utils";

export type MessageAttachment = { name: string; url: string };

export function MessageBubble({
  authorName,
  authorType,
  body,
  attachments,
  createdAt,
}: {
  authorName: string;
  authorType: "customer" | "staff" | "system";
  body: string;
  attachments?: MessageAttachment[];
  createdAt: string;
}) {
  if (authorType === "system") {
    return <p className="py-1 text-center text-xs text-muted-foreground">{body}</p>;
  }

  return (
    <div className={cn("flex gap-3 py-3", authorType === "staff" && "flex-row-reverse text-right")}>
      <Avatar name={authorName} />
      <div className={cn("max-w-[75%] space-y-1.5", authorType === "staff" && "items-end")}>
        <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{authorName}</span>
          <span>{new Date(createdAt).toLocaleString()}</span>
        </div>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
            authorType === "staff" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          )}
        >
          {body}
        </div>
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((a) => (
              <FileChip key={a.url} name={a.name} url={a.url} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
