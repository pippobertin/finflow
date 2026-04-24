import { HelpCenter } from "@/components/help/help-center";
import { chapters } from "@/content/help/client";
import { stripContent } from "@/content/help/types";

const metaChapters = stripContent(chapters);
const allSections = chapters.flatMap((ch) => ch.sections);

export default async function ClientAiutoPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const activeSlug = slug?.[0] ?? allSections[0]?.slug ?? "";
  const section = allSections.find((s) => s.slug === activeSlug);
  const Content = section?.content;

  return (
    <HelpCenter chapters={metaChapters} basePath="/aiuto">
      {Content ? <Content /> : null}
    </HelpCenter>
  );
}
