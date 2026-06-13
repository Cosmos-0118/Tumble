import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsComponent,
});

function TermsComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-24 text-neutral-200">
      <div className="relative mx-auto max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sandbox
          </Link>
        </div>
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Terms of Service
        </h1>
        <div className="space-y-6 leading-relaxed text-neutral-400">
          <p>
            Welcome to Tumble. By accessing or using our application, you agree to be bound by these
            terms. Tumble is a creative sandbox for physics and audio simulation.
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-white">1. Usage Rights</h2>
          <p>
            We grant you a personal, non-exclusive right to use Tumble. You may not use it for
            illegal or unauthorized purposes. The simulation logic, audio generation, and UI are
            provided "as is".
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-white">2. User Content</h2>
          <p>
            Contraptions or configurations you create in Tumble remain yours. However, by creating
            them within our platform, you grant us permission to run, store, and process them
            locally on your device.
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-white">3. Disclaimer of Warranties</h2>
          <p>
            Our services are provided without warranty of any kind. We are not responsible for any
            damages or losses resulting from your use of the application.
          </p>
        </div>
      </div>
    </div>
  );
}
