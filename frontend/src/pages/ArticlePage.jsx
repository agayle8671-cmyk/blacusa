import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getArticle } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { CommentSection } from "@/components/CommentSection";

const CAT_LABEL = {
  "politics": "Politics",
  "health-equity": "Health Equity",
  "criminal-justice": "Criminal Justice",
  "environmental-racism": "Environmental Racism",
  "solutions": "Solutions",
  "rural": "Rural",
};

export default function ArticlePage() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["article", slug], queryFn: () => getArticle(slug) });

  if (isLoading) {
    return <div className="mx-auto max-w-2xl px-6 py-32 text-center font-mono text-sm text-muted-foreground">Loading…</div>;
  }
  if (!data) return null;
  const { article, related } = data;

  return (
    <article className="bg-background pb-24" data-testid="article-page">
      <div className="mx-auto max-w-3xl px-6 pt-14 md:pt-20">
        <Link to={`/category/${article.category}`} className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {CAT_LABEL[article.category]}
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="overline text-accent">{CAT_LABEL[article.category]}</span>
          {article.is_solutions && (
            <span className="inline-flex items-center gap-1.5 border border-accent px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Solutions
            </span>
          )}
        </div>

        <h1 className="mt-4 font-heading text-4xl font-medium leading-[1.02] tracking-tight text-foreground sm:text-6xl">
          {article.title}
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-muted-foreground">{article.dek}</p>

        <div className="mt-8 flex items-center gap-4 border-y border-border py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-heading text-lg text-primary-foreground">
            {article.author?.[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{article.author}</p>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {article.author_role} &middot; {article.read_minutes} min read
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-4xl px-6">
        <div className="overflow-hidden">
          <img src={article.image} alt={article.title} className="img-editorial aspect-[16/9] w-full object-cover" />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-2xl px-6">
        {article.content_warning && (
          <div data-testid="content-warning" className="mb-8 flex items-start gap-3 border-l-2 border-accent bg-muted p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Content note. </span>
              {article.content_warning}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {article.body?.map((p, i) => (
            <p
              key={i}
              className={`leading-[1.85] text-foreground ${
                i === 0
                  ? "text-xl first-letter:float-left first-letter:mr-3 first-letter:font-heading first-letter:text-7xl first-letter:font-medium first-letter:leading-[0.8] first-letter:text-accent"
                  : "text-lg"
              }`}
            >
              {p}
            </p>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-8">
          {article.tags?.map((t) => (
            <span key={t} className="border border-border px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      </div>

      <CommentSection slug={article.slug} />

      {related?.length > 0 && (
        <div className="mx-auto mt-24 max-w-container px-6 md:px-12">
          <h2 className="mb-10 border-b border-foreground pb-4 font-heading text-3xl font-medium tracking-tight text-foreground">
            More from {CAT_LABEL[article.category]}
          </h2>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
