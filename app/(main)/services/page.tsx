import { listMyServicesAction, listServiceCatalogAction } from "@/app/actions/service";
import Services from "@/component/services/Services";

// The client's own services — the ones their BayShore team chose for them — and, under them,
// everything else on offer, to read. (Pass `browse` to Services to let them tick and add from it.)
const ServicesPage = async () => {
  const [mine, catalog] = await Promise.all([listMyServicesAction(), listServiceCatalogAction()]);

  return (
    <Services
      mine={mine.ok ? mine.data : undefined}
      mineError={mine.error}
      catalog={catalog.ok ? catalog.data : undefined}
      catalogError={catalog.error}
    />
  );
};

export default ServicesPage;
