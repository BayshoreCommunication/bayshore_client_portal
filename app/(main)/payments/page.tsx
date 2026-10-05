import { getServiceOrderAction, listMyServicesAction, listServiceCatalogAction } from "@/app/actions/service";
import Checkout from "@/component/payments/Checkout";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Three ways in:
//   /payments                      the order from the cart (kept in the browser), ready to pay
//   /payments?session_id=cs_…      back from Stripe — how that payment went
//   /payments?cancelled=1          backed out of Stripe — the order again, with a note
const PaymentsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const sessionId = first(params.session_id);

  if (sessionId) {
    const order = await getServiceOrderAction(sessionId);
    return <Checkout sessionId={sessionId} order={order.ok ? order.data : undefined} orderError={order.error} />;
  }

  // The order is priced from the catalog and what the client already takes.
  const [mine, catalog] = await Promise.all([listMyServicesAction(), listServiceCatalogAction()]);

  return (
    <Checkout
      mine={mine.ok ? mine.data : undefined}
      catalog={catalog.ok ? catalog.data : undefined}
      error={mine.ok ? catalog.error : mine.error}
      cancelled={first(params.cancelled) === "1"}
    />
  );
};

export default PaymentsPage;
