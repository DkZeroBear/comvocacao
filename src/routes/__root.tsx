import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Comvocação — Credenciamento" },
      {
        name: "description",
        content:
          "Formulário de credenciamento para a Festa da Família. Festa e Música que transformam.",
      },
      { property: "og:title", content: "Comvocação — Credenciamento" },
      {
        property: "og:description",
        content:
          "Formulário de credenciamento para a Festa da Família. Festa e Música que transformam.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Comvocação — Credenciamento" },
      { name: "description", content: "Festa em prol das vocações sacerdotais." },
      { property: "og:description", content: "Festa em prol das vocações sacerdotais." },
      { name: "twitter:description", content: "Festa em prol das vocações sacerdotais." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/udBDpJdqTHbYwhapRTxDCSwFHth1/social-images/social-1776959892632-WhatsApp_Image_2026-04-23_at_12.50.28.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/udBDpJdqTHbYwhapRTxDCSwFHth1/social-images/social-1776959892632-WhatsApp_Image_2026-04-23_at_12.50.28.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
