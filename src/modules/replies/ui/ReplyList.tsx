import type { ReplyDto } from '../application/ReplyUseCases.js';

export function ReplyList({ replies }: { replies: ReplyDto[] }) {
  if (replies.length === 0) {
    return <p className="text-sm text-muted-foreground">No replies yet.</p>;
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <div key={reply.id} className="rounded-md border border-border p-3">
          <p className="text-xs font-medium text-primary">{reply.authorDisplayName}</p>
          <p className="mt-1 text-sm">{reply.content}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {reply.createdAt.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
