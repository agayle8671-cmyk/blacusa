import { useQuery } from "@tanstack/react-query";
import Marquee from "react-fast-marquee";
import { getArticles } from "@/lib/api";

export const BreakingTicker = () => {
  const { data: articles = [] } = useQuery({
    queryKey: ["ticker"],
    queryFn: () => getArticles({ limit: 8 }),
  });

  const items = articles.length
    ? articles
    : [{ slug: "_", title: "BlacUSA — journalism with context, community, and consequence" }];

  return (
    <div
      data-testid="breaking-ticker"
      className="flex items-stretch border-b border-border bg-primary text-primary-foreground"
    >
      <div className="flex shrink-0 items-center gap-2 bg-accent px-4 py-2 text-accent-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-foreground" />
        <span className="overline">Breaking</span>
      </div>
      <Marquee speed={42} gradient={false} pauseOnHover className="py-2">
        {items.concat(items).map((a, i) => (
          <a
            key={i}
            href={`/article/${a.slug}`}
            className="mx-8 text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
          >
            <span className="mr-3 font-mono text-accent-foreground/70">/</span>
            {a.title}
          </a>
        ))}
      </Marquee>
    </div>
  );
};
