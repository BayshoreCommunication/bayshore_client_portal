import { listMyContentAction } from "@/app/actions/content";
import ContentList from "@/component/content/ContentList";
import { poppins } from "@/component/shared/fonts";

// The backend's page-size cap; the list filters and pages these in the browser.
const CONTENT_LIMIT = 100;

const ContentPage = async () => {
  const result = await listMyContentAction({ limit: CONTENT_LIMIT });

  if (!result.ok || !result.data) {
    return (
      <div className={`${poppins.className} flex flex-col gap-4.5`}>
        <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Content</div>
        <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
          {result.error ?? "Could not load your content."} Please refresh the page to try again.
        </div>
      </div>
    );
  }

  return <ContentList items={result.data.items} />;
};

export default ContentPage;
