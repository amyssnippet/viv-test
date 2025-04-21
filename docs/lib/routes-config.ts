// for page navigation & to sort on leftbar

export type EachRoute = {
  title: string;
  href: string;
  noLink?: true;
  items?: EachRoute[];
};

export const ROUTES: EachRoute[] = [
  {
    title: "Getting Started",
    href: "/getting-started",
    noLink: true,
    items: [
      { title: "Introduction", href: "/introduction" },
      {
        title: "Installation",
        href: "/installation",
      },
      {
        title: "Quick Start Guide",
        href: "/quick-start-guide",
        noLink: true,
        items: [
          { title: "Node JS", href: "/node" },
          { title: "JSR (deno)", href: "/deno" },
        ],
      },
    ],
  },
];

type Page = { title: string; href: string };

// Helper to cleanly join paths
function joinPath(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path}`;
}

function getRecursiveLinks(node: EachRoute, parentHref = ""): Page[] {
  const fullHref = joinPath(parentHref, node.href);
  const pages: Page[] = [];

  if (!node.noLink) {
    pages.push({ title: node.title, href: fullHref });
  }

  if (node.items) {
    for (const child of node.items) {
      pages.push(...getRecursiveLinks(child, fullHref));
    }
  }

  return pages;
}

export const page_routes = ROUTES.flatMap((route) => getRecursiveLinks(route));
