import { getMyEmailsAction } from "@/app/actions/emails";
import EmailSettings from "@/component/settings/EmailSettings";

const SettingsPage = async () => {
  const result = await getMyEmailsAction();
  return <EmailSettings initial={result.ok ? result.data : undefined} error={result.ok ? undefined : result.error} />;
};

export default SettingsPage;
