"use client"

import React from 'react'
import Head from 'next/head'
import { defaultSEO } from '@/lib/seo/config'

interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  openGraph?: {
    title?: string
    description?: string
    url?: string
    type?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
      alt?: string
    }>
  }
  twitter?: {
    cardType?: string
    handle?: string
    site?: string
  }
  noindex?: boolean
  nofollow?: boolean
}

export default function SEO({
  title,
  description,
  canonical,
  openGraph,
  twitter,
  noindex = false,
  nofollow = false,
}: SEOProps) {
  // Merge with defaults
  const seo = {
    title: title || defaultSEO.title,
    description: description || defaultSEO.description,
    canonical: canonical || defaultSEO.canonical,
    openGraph: {
      title: openGraph?.title || title || defaultSEO.openGraph.title,
      description: openGraph?.description || description || defaultSEO.openGraph.description,
      url: openGraph?.url || canonical || defaultSEO.openGraph.url,
      type: openGraph?.type || defaultSEO.openGraph.type,
      images: openGraph?.images || defaultSEO.openGraph.images,
    },
    twitter: {
      cardType: twitter?.cardType || defaultSEO.twitter.cardType,
      handle: twitter?.handle || defaultSEO.twitter.handle,
      site: twitter?.site || defaultSEO.twitter.site,
    },
    robots: `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`,
  }

  return (
    <Head>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={seo.canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.openGraph.title} />
      <meta property="og:description" content={seo.openGraph.description} />
      <meta property="og:url" content={seo.openGraph.url} />
      <meta property="og:type" content={seo.openGraph.type} />
      <meta property="og:site_name" content={defaultSEO.openGraph.site_name} />
      
      {/* Open Graph Images */}
      {seo.openGraph.images?.map((image, index) => (
        <React.Fragment key={`og-image-${index}`}>
          <meta property="og:image" content={image.url} />
          {image.width && <meta property="og:image:width" content={String(image.width)} />}
          {image.height && <meta property="og:image:height" content={String(image.height)} />}
          {image.alt && <meta property="og:image:alt" content={image.alt} />}
        </React.Fragment>
      ))}
      
      {/* Twitter */}
      <meta name="twitter:card" content={seo.twitter.cardType} />
      <meta name="twitter:site" content={seo.twitter.site} />
      <meta name="twitter:creator" content={seo.twitter.handle} />
      <meta name="twitter:title" content={seo.openGraph.title} />
      <meta name="twitter:description" content={seo.openGraph.description} />
      {seo.openGraph.images?.[0] && (
        <meta name="twitter:image" content={seo.openGraph.images[0].url} />
      )}
      
      {/* Robots */}
      <meta name="robots" content={seo.robots} />
      
      {/* Additional Meta Tags */}
      {defaultSEO.additionalMetaTags?.map((tag, index) => (
        <meta key={`meta-tag-${index}`} name={tag.name} content={tag.content} />
      ))}
    </Head>
  )
} 