import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getArticles, getCategories } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";

export default function CategoryPage() {
  const { slug } = useParams();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: articles, isLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => getArticles({ category: slug }),
  });

  const cat = Array.isArray(categories) ? categories.find((c) => c.slug === slug) : null;
  const articlesArray = Array.isArray(articles) ? articles : [];
  const lead = articlesArray[0];
  const rest = articlesArray.slice(1);

  return (
    <div className="bg-background" data-testid="category-page">
      <section className="border-b border-border">
        <div className="mx-auto max-w-container px-6 py-16 md:px-12 md:py-24">
          <p className="overline text-accent">Section</p>
          <h1 className="mt-3 font-heading text-5xl font-medium tracking-tight text-foreground sm:text-7xl">
            {cat?.name || slug}
          </h1>
          {cat?.blurb && <p className="mt-5 max-w-xl text-lg text-muted-foreground">{cat.blurb}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-container px-6 py-16 md:px-12">
        {isLoading ? (
          <p className="font-mono text-sm text-muted-foreground">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">No stories in this section yet.</p>
        ) : (
          <>
            {lead && (
              <div className="mb-16 border-b border-border pb-16">
                <ArticleCard article={lead} variant="feature" />
              </div>
            )}
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
