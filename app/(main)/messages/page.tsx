import { listMyMessagesAction } from "@/app/actions/messages";
import Messages from "@/component/messages/Messages";

// The client's conversation with the BayShore team.
const MessagesPage = async () => {
  const initial = await listMyMessagesAction();
  return <Messages initial={initial} />;
};

export default MessagesPage;
