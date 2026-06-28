import React from "react";
import { WorldRow } from "@/components/WorldRow";

/* A themed dashboard section: grey uppercase title + a stack of rows. */
export const Section = ({ section }) => {
  return (
    <section className="mt-12 first:mt-0" data-testid={`section-${section.key}`} id={section.key}>
      <h2 className="wm mb-2 text-[19px] font-light uppercase tracking-[0.04em] text-muted-foreground">
        {section.title}
      </h2>
      <div>
        {section.rows.map((row) => (
          <WorldRow key={row.slug} row={row} />
        ))}
      </div>
    </section>
  );
};
