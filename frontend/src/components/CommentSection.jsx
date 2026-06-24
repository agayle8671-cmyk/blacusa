import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ShieldCheck, Check, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/lib/api";
import { useAuth, adminClient } from "@/lib/auth";

const fetchComments = (slug) =>
  axios.get(`${API}/articles/${slug}/comments`).then((r) => r.data);

export const CommentSection = ({ slug }) => {
  const { user } = useAuth();
  const { data: comments = [], refetch } = useQuery({
    queryKey: ["comments", slug],
    queryFn: () => fetchComments(slug),
  });
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Please write a comment first.");
      return;
    }
    try {
      const { data } = await adminClient.post(`/articles/${slug}/comments`, { body });
      setSubmitted(true);
      setBody("");
      toast.success(data.message || "Comment submitted for review.");
      refetch();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const field = "w-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-accent";

  return (
    <section className="mx-auto mt-20 max-w-2xl px-6" data-testid="comment-section">
      <div className="flex items-center gap-2 border-b border-foreground pb-4">
        <MessageSquare className="h-5 w-5 text-accent" />
        <h2 className="font-heading text-3xl font-medium tracking-tight text-foreground">
          Community Response {comments.length > 0 && <span className="text-muted-foreground">({comments.length})</span>}
        </h2>
      </div>

      <div className="mt-8 space-y-6">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Be the first to add to this conversation.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} data-testid={`comment-${c.id}`} className="border-l-2 border-border pl-5">
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-medium text-foreground">{c.name}</span>
                {c.verified && <BadgeCheck className="h-4 w-4 text-accent" title="Verified reader" />}
                <span className="font-mono text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1.5 leading-relaxed text-foreground">{c.body}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 border border-border bg-muted p-6 md:p-8">
        {!user ? (
          <div data-testid="comment-signin-gate" className="text-center">
            <h3 className="font-heading text-2xl font-medium text-foreground">Join the conversation</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              BlacUSA readers comment under a verified name. Sign in or create a free account to add your voice.
            </p>
            <Link
              to={`/account?from=/article/${slug}`}
              data-testid="comment-signin-link"
              className="mt-5 inline-block bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent"
            >
              Sign in to comment
            </Link>
          </div>
        ) : submitted ? (
          <p data-testid="comment-success" className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-accent" /> Thank you, {user.name?.split(" ")[0]}. Your comment will appear after editorial review.
          </p>
        ) : (
          <form onSubmit={onSubmit} data-testid="comment-form">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="font-heading text-2xl font-medium text-foreground">Add your voice</h3>
              <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-widest text-accent">
                <BadgeCheck className="h-3.5 w-3.5" /> {user.name}
              </span>
            </div>
            <textarea
              rows={4}
              required
              className={field + " resize-none"}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your perspective respectfully…"
              data-testid="comment-body"
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="flex items-center gap-1.5 font-mono text-[0.65rem] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Reviewed before publishing.
              </p>
              <button type="submit" data-testid="comment-submit" className="bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent">
                Post comment
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
