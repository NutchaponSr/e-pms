import { caller } from "@/trpc/server";

const Page = async () => {
  const greeting = await caller.greeting({ name: "John" });

  return (
    <div>{greeting.message}</div>
  );
}

export default Page;