import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-screen w-full">
      <h1 className="tracking-wider font-bold text-5xl text-primary">
        404
      </h1>
      <h2 className="text-primary text-lg font-medium">
        Oops, This page not found!
      </h2>
      <p className="text-tertiary text-sm">
        This link might be currupted or the page may have been removed.
      </p>
      <Button variant="outline" size="lg" className="mt-4" asChild>
        <Link href="/">
          Go back
        </Link>
      </Button>
    </div>
  );
}