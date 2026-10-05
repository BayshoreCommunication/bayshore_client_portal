import { listMyServicesAction, listServiceCatalogAction } from "@/app/actions/service";
import Services from "@/component/services/Services";

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
