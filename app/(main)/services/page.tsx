import { listMyServicesAction } from "@/app/actions/service";
import Services from "@/component/services/Services";

// The client's active services, what they pay a month, and — under them — everything BayShore
// offers, to read and request.
const ServicesPage = async () => {
  const mine = await listMyServicesAction();
  return <Services mine={mine.ok ? mine.data : undefined} mineError={mine.error} />;
};

export default ServicesPage;
