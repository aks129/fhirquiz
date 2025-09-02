import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEOHead({
  title = "FHIR Healthcare Bootcamp - Master Healthcare Interoperability in 3 Days",
  description = "Learn FHIR through hands-on labs with real servers, synthetic patient data, and practical transformations. Start your free trial today!",
  image = "/og-hero.png",
  url = "https://fhir-bootcamp.com",
  type = "website"
}: SEOHeadProps) {
  const fullTitle = title.includes("FHIR") ? title : `${title} | FHIR Healthcare Bootcamp`;
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="FHIR, healthcare, interoperability, training, bootcamp, HL7, health data, medical technology" />
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="FHIR Healthcare Bootcamp" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@fhirbootcamp" />
      <meta name="twitter:creator" content="@fhirbootcamp" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="FHIR Healthcare Bootcamp" />
      <meta name="theme-color" content="#2563eb" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "FHIR Healthcare Bootcamp",
          "description": description,
          "url": url,
          "logo": `${url}/og-hero.png`,
          "sameAs": [
            "https://twitter.com/fhirbootcamp",
            "https://linkedin.com/company/fhir-bootcamp"
          ],
          "offers": {
            "@type": "Offer",
            "category": "Education",
            "priceCurrency": "USD",
            "price": "299",
            "availability": "https://schema.org/InStock"
          }
        })}
      </script>
    </Helmet>
  );
}