import { Link } from "react-router-dom";

const CAT_LABEL = {
  "politics": "Politics",
  "health-equity": "Health Equity",
  "criminal-justice": "Criminal Justice",
  "environmental-racism": "Environment",
  "solutions": "Solutions",
  "rural": "Rural",
};

const SolutionsTag = () => (
  <span className="inline-flex items-center gap-1.5 border border-accent px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-accent">
    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Solutions
  </span>
);

export const ArticleCard = ({ article, variant = "standard" }) => {
  if (!article) return null;
  const to = `/article/${article.slug}`;
  const cat = CAT_LABEL[article.category] || article.category;

  if (variant === "feature") {
    return (
      <Link to={to} data-testid={`article-feature-${article.slug}`} className="group block">
        <div className="overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="img-editorial aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <span className="overline text-accent">{cat}</span>
          {article.is_solutions && <SolutionsTag />}
        </div>
        <h2 className="mt-3 font-heading text-4xl font-medium leading-[1.02] tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-5xl">
          {article.title}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{article.dek}</p>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {article.author} &middot; {article.read_minutes} min read
        </p>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to={to}
        data-testid={`article-compact-${article.slug}`}
        className="group block border-b border-border py-5 first:pt-0"
      >
        <div className="flex items-center gap-3">
          <span className="overline text-accent">{cat}</span>
          {article.is_solutions && <SolutionsTag />}
        </div>
        <h3 className="mt-2 font-heading text-2xl font-medium leading-tight tracking-tight text-foreground transition-colors group-hover:text-accent">
          {article.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{article.dek}</p>
      </Link>
    );
  }

  // standard
  return (
    <Link to={to} data-testid={`article-card-${article.slug}`} className="group flex flex-col">
      <div className="overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="img-editorial aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="overline text-accent">{cat}</span>
        {article.is_solutions && <SolutionsTag />}
      </div>
      <h3 className="mt-2 font-heading text-2xl font-medium leading-tight tracking-tight text-foreground transition-colors group-hover:text-accent">
        {article.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{article.dek}</p>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {article.author} &middot; {article.read_minutes} min
      </p>
    </Link>
  );
};
