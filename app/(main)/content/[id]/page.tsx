import { notFound } from "next/navigation";
import { getMyContentAction, listMyContentAction } from "@/app/actions/content";
import ContentDetails from "@/component/content/ContentDetails";
import { batchLabelOf, piecesOf } from "@/component/content/contentUi";
import { poppins } from "@/component/shared/fonts";

const RELATED_LIMIT = 5;

const ContentDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Anything that isn't a content id is simply not found.
  if (!/^[0-9a-f]{24}$/i.test(id)) notFound();

  const result = await getMyContentAction(id);
  // 404 = gone, a draft, or another client's.
  if (result.status === 404 || result.status === 422) notFound();
  if (!result.ok || !result.data) {
    return (
      <div className={`${poppins.className} flex flex-col gap-4.5`}>
        <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Content</div>
        <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
          {result.error ?? "Could not load this content."} Please refresh the page to try again.
        </div>
      </div>
    );
  }

  const item = result.data;
  // Other pieces from the same batch — apart from the ones sent together with this one,
  // which the page lists on their own.
  const batch = batchLabelOf(item);
  const group = piecesOf(item).map((piece) => piece._id);
  const others = await listMyContentAction({ batchMonth: item.batchMonth, limit: 50 });
  const related = (others.data?.items ?? [])
    .filter((other) => !group.includes(other._id) && batchLabelOf(other) === batch)
    .slice(0, RELATED_LIMIT);

  return <ContentDetails item={item} related={related} />;
};

export default ContentDetailsPage;
