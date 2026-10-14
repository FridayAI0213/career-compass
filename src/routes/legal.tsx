import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Privacy, terms & support — JobOS" },
      { name: "description", content: "How JobOS handles your data, terms of use, subscriptions and how to get support." },
      { property: "og:title", content: "Privacy, terms & support — JobOS" },
      { property: "og:description", content: "Privacy, terms, subscription and support information for JobOS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-12 text-sm leading-relaxed">
      <Link to="/" className="text-primary hover:underline">← JobOS</Link>
      <h1 className="font-display text-3xl">Privacy, terms & support</h1>
      <p className="rounded-md border border-border bg-muted/40 p-3 text-muted-foreground">
        Draft summary pending review. The operator's legal name, address and support email still need to be added before public launch.
      </p>
      <section id="privacy" className="space-y-2">
        <h2 className="font-display text-xl">Privacy</h2>
        <p>Your career record, documents and applications are private to your account and are not shown to other users. Text you submit for AI analysis is sent to an AI model provider to produce the result. You can delete records at any time from inside the app.</p>
      </section>
      <section id="terms" className="space-y-2">
        <h2 className="font-display text-xl">Terms of use</h2>
        <p>JobOS provides career-organisation tools and match scores as guidance only. It does not guarantee interviews, offers or the accuracy of third-party job listings. Always verify requirements on the employer's original posting.</p>
      </section>
      <section id="subscriptions" className="space-y-2">
        <h2 className="font-display text-xl">Subscriptions & refunds</h2>
        <p>Paid plans are not on sale yet. When they launch, pricing, billing period, cancellation and refund terms will be shown here and at checkout before you pay.</p>
      </section>
      <section id="support" className="space-y-2">
        <h2 className="font-display text-xl">Support</h2>
        <p>A support contact address will be published here before launch.</p>
      </section>
    </main>
  );
}
