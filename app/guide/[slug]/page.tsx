import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide, getAllGuideSlugs, isGuidePublished } from "@/lib/guides";
import { renderGuideMarkdown } from "@/lib/markdown";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    robots: isGuidePublished(slug) ? undefined : "noindex, nofollow",
    openGraph: {
      title: g.h1,
      description: g.description,
      type: "article",
      publishedTime: g.publishedAt,
      modifiedTime: g.updatedAt,
      images: g.hero.src ? [g.hero.src] : [],
    },
    alternates: { canonical: `https://next.scoute.app/guide/${slug}` },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isGuidePublished(slug)) notFound();
  const g = getGuide(slug);
  if (!g) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.h1,
    description: g.description,
    datePublished: g.publishedAt,
    dateModified: g.updatedAt,
    image: g.hero.src || undefined,
    author: { "@type": "Organization", name: "Scoute" },
    publisher: {
      "@type": "Organization",
      name: "Scoute",
      logo: { "@type": "ImageObject", url: "https://next.scoute.app/scoute-logo.svg" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://next.scoute.app/guide/${slug}` },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: g.faq.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Грузия", item: "https://next.scoute.app/georgia" },
      {
        "@type": "ListItem",
        position: 2,
        name: g.cityRu,
        item: `https://next.scoute.app/cities/${g.city}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: g.h1,
        item: `https://next.scoute.app/guide/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div
          className="mb-6 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "#FFE4B5", border: "1px solid #F47B21", color: "#7A3E0A" }}
        >
          ⚠️ ЧЕРНОВИК — текст в редактуре у автора. Не индексируется. Не цитировать.
        </div>
        <nav className="text-sm text-gray-500 mb-6" aria-label="Хлебные крошки">
          <Link href="/georgia" className="hover:underline">
            Грузия
          </Link>
          <span className="mx-2">›</span>
          <Link href={`/cities/${g.city}`} className="hover:underline">
            {g.cityRu}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Гид</span>
        </nav>

        <header className="mb-8">
          <h1
            className="font-extrabold leading-tight mb-4"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "clamp(28px, 5vw, 44px)",
              color: "var(--dark)",
            }}
          >
            {g.h1}
          </h1>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">{g.intro}</p>
        </header>

        {g.hero.src ? (
          <figure className="mb-10 -mx-4 md:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={g.hero.src}
              alt={g.hero.alt}
              className="w-full aspect-[16/9] object-cover md:rounded-2xl"
            />
            <figcaption className="text-xs text-gray-400 mt-2 px-4 md:px-0">{g.hero.alt}</figcaption>
          </figure>
        ) : null}

        <div className="prose-scoute">{renderGuideMarkdown(g.body)}</div>

        {g.voiceOfScout ? (
          <section
            className="my-10 p-5 md:p-6 rounded-2xl"
            style={{ background: "#FFF5EC", border: "1px solid #F4D2B0" }}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
              🎙 Голос Scoute
            </div>
            <div className="text-base leading-[1.7] text-gray-800">
              {renderGuideMarkdown(g.voiceOfScout)}
            </div>
          </section>
        ) : null}

        <section className="my-10">
          <h2
            className="text-2xl md:text-3xl font-extrabold mb-5"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: "var(--dark)" }}
          >
            Практика
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {g.practical.address ? (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <dt className="text-xs uppercase tracking-wider text-gray-400 mb-1">Адрес</dt>
                <dd className="text-sm text-gray-800">{g.practical.address}</dd>
              </div>
            ) : null}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <dt className="text-xs uppercase tracking-wider text-gray-400 mb-1">Как добраться</dt>
              <dd className="text-sm text-gray-800">{g.practical.howToGet}</dd>
            </div>
            {g.practical.hours ? (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <dt className="text-xs uppercase tracking-wider text-gray-400 mb-1">Часы работы</dt>
                <dd className="text-sm text-gray-800">{g.practical.hours}</dd>
              </div>
            ) : null}
            {g.practical.price ? (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <dt className="text-xs uppercase tracking-wider text-gray-400 mb-1">Цена</dt>
                <dd className="text-sm text-gray-800">{g.practical.price}</dd>
              </div>
            ) : null}
            {g.practical.bestTime ? (
              <div className="bg-white rounded-xl p-4 border border-gray-100 md:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Когда лучше
                </dt>
                <dd className="text-sm text-gray-800">{g.practical.bestTime}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="my-10">
          <h2
            className="text-2xl md:text-3xl font-extrabold mb-5"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: "var(--dark)" }}
          >
            Вопросы и ответы
          </h2>
          <div className="space-y-3">
            {g.faq.map((f, i) => (
              <details
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-4 group"
              >
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-start justify-between gap-2">
                  <span>{f.q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="my-10">
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{ background: "linear-gradient(135deg, #1B4D6E 0%, #2C7BA0 100%)" }}
          >
            <h2
              className="text-2xl md:text-3xl font-extrabold mb-3 text-white"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Поедем сюда вместе
            </h2>
            <p className="text-white/85 mb-5 leading-relaxed">
              Соберите программу поездки в {g.cityRu} с AI-помощником — он подберёт места по
              интересам, разложит по дням и покажет реальные цены на отель и билет.
            </p>
            <Link
              href="/trip/draft"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition hover:scale-105"
              style={{ background: "#F47B21", color: "white" }}
            >
              ✨ Составить программу
            </Link>
          </div>
        </section>

        <section className="my-10">
          <h2
            className="text-xl md:text-2xl font-extrabold mb-5"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: "var(--dark)" }}
          >
            Что рядом
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {g.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="block bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition"
              >
                <div className="font-semibold text-gray-900">{r.title}</div>
                {r.subtitle ? (
                  <div className="text-xs text-gray-500 mt-1">{r.subtitle}</div>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </>
  );
}
