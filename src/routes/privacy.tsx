import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyComponent,
});

function PrivacyComponent() {
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
          Privacy Policy
        </h1>
        <div className="space-y-6 leading-relaxed text-neutral-400">
          <p>
            At Tumble, your privacy is our priority. We believe that your data is yours. This
            privacy policy explains how we handle information when you use our application.
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-white">1. Information We Collect</h2>
          <p>
            Tumble operates primarily as a client-side application. We do not actively collect
            personal information, tracking data, or usage telemetry without your explicit consent.
            Your physics sandbox state is processed locally.
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-white">2. Local Storage</h2>
          <p>
            We may use local storage in your browser to save your preferences, tool selections, and
            sandbox creations. This data never leaves your device unless you explicitly choose to
            export or share it.
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-white">3. Third-Party Services</h2>
          <p>We do not sell, trade, or otherwise transfer your information to outside parties.</p>
          <h2 className="mt-8 text-2xl font-semibold text-white">4. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. Any changes will be reflected on
            this page.
          </p>
        </div>
      </div>
    </div>
  );
}
