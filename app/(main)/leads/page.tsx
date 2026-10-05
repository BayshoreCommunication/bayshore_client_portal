import { redirect } from "next/navigation";
import { listMyLeadsAction } from "@/app/actions/leads";
import Leads from "@/component/leads/Leads";
import {
  DEFAULT_PERIOD,
  LEADS_PER_PAGE,
  isLeadChannel,
  isLeadPeriod,
  isLeadStatus,
  leadsHref,
  periodRange,
  type LeadFilters,
} from "@/component/leads/leadUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const LeadsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const rawPeriod = first(params.period);
  const rawStatus = first(params.status);
  const rawChannel = first(params.channel);
  const filters: LeadFilters = {
    period: isLeadPeriod(rawPeriod) ? rawPeriod : DEFAULT_PERIOD,
    status: isLeadStatus(rawStatus) ? rawStatus : "all",
    channel: isLeadChannel(rawChannel) ? rawChannel : "all",
    caseType: first(params.caseType)?.trim() || "all",
    q: first(params.q)?.trim() ?? "",
  };
  const page = Math.max(1, Number(first(params.page)) || 1);
  const range = periodRange(filters.period);

  const [result, previous] = await Promise.all([
    listMyLeadsAction({
      page,
      limit: LEADS_PER_PAGE,
      status: filters.status,
      channel: filters.channel,
      caseType: filters.caseType,
      search: filters.q,
      from: range.from,
      to: range.to,
    }),
    // Only the counts are needed from the period before, for the ▲/▼ on the tiles.
    range.previous ? listMyLeadsAction({ limit: 1, ...range.previous }) : null,
  ]);

  // A stale or hand-edited ?page=99 lands on the last page that exists instead of an empty list.
  const totalPages = result.data?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) redirect(leadsHref({ ...filters, page: totalPages }));

  return (
    <Leads
      data={result.ok ? result.data : undefined}
      error={result.error}
      previousSummary={previous?.ok ? previous.data?.summary : undefined}
      compareLabel={range.compareLabel}
      filters={filters}
    />
  );
};

export default LeadsPage;
