import { caller } from "@/trpc/server";

import { Button } from "@/components/ui/button";

const Page = async () => {
  const greeting = await caller.greeting({ name: "Pondpopza" });

  return (
    <div>
      <Button>Click me</Button>
      {greeting.message}
    </div>
  );
};

export default Page;
