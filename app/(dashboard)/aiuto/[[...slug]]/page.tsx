import { HelpCenter } from "@/components/help/help-center";
import { chapters } from "@/content/help/client";

export default function ClientAiutoPage() {
  return <HelpCenter chapters={chapters} basePath="/aiuto" />;
}
