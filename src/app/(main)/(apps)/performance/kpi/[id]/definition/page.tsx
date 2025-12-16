const Page = async (props: PageProps<"/performance/kpi/[id]/draft">) => {
  return (
    <div>
      {(await props.params).id}
    </div>
  );
}

export default Page;