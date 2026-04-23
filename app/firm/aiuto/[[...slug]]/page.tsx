import { HelpCenter } from "@/components/help/help-center";
import { chapters } from "@/content/help/firm";

export default function FirmAiutoPage() {
  return <HelpCenter chapters={chapters} basePath="/firm/aiuto" />;
}
