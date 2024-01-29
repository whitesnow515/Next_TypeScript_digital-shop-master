import Head from "next/head";
import { NextSeo } from "next-seo";

import { AppConfig } from "@util/AppConfig";

type MetaPropsInterface = {
  title: string;
  titleOverride?: string;
  description: string;
  canonical?: string;
  image?: string;
  largeImage?: boolean;
  color?: string;
};

const Meta = ({
  title,
  titleOverride,
  description,
  canonical,
  image,
  largeImage,
  color = "#ffffff",
}: MetaPropsInterface) => {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" key="charset" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1"
          key="viewport"
        />
        <link
          rel="apple-touch-icon"
          href={`/apple-touch-icon.png`}
          key="apple"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`/favicon-32x32.png`}
          key="icon32"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`/favicon-16x16.png`}
          key="icon16"
        />
        <link rel="icon" href={`/favicon.ico`} key="favicon" />
        {image && <meta property="og:image" content={image} />}
        {color && <meta name="theme-color" content={color} />}
        {largeImage && (
          <meta name="twitter:card" content="summary_large_image" />
        )}
      </Head>
      <NextSeo
        title={titleOverride || `${AppConfig.title} - ${title}`}
        description={description}
        canonical={canonical}
        openGraph={{
          title: titleOverride || title,
          description,
          url: canonical,
          locale: AppConfig.locale,
          site_name: AppConfig.site_name,
        }}
      />
    </>
  );
};

export { Meta };
