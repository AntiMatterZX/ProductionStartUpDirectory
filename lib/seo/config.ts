/**
 * SEO Configuration
 * 
 * This file contains default SEO settings and page-specific configurations
 * that will be used throughout the application.
 */

// Default SEO configuration
export const defaultSEO = {
  title: 'Startup Directory - Connect Startups with Investors',
  description: 'The premier platform for startups to showcase innovations and connect with investors looking for the next breakthrough opportunity.',
  canonical: 'https://production-start-up-directory.vercel.app',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://production-start-up-directory.vercel.app',
    site_name: 'Startup Directory',
    title: 'Startup Directory - Connect Startups with Investors',
    description: 'The premier platform for startups to showcase innovations and connect with investors looking for the next breakthrough opportunity.',
    images: [
      {
        url: 'https://production-start-up-directory.vercel.app/seo/images/home-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Startup Directory',
      }
    ],
  },
  twitter: {
    handle: '@startupdirectory',
    site: '@startupdirectory',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'theme-color',
      content: '#4f46e5',
    },
    {
      name: 'application-name',
      content: 'Startup Directory',
    }
  ],
}

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'Startup Directory - Connect Startups with Investors',
    description: 'Discover innovative startups, connect with investors, and find your next big opportunity on Startup Directory.',
    openGraph: {
      images: [
        {
          url: 'https://production-start-up-directory.vercel.app/seo/images/home-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Startup Directory Homepage',
        }
      ],
    }
  },
  startups: {
    title: 'Discover Startups - Startup Directory',
    description: 'Browse through our curated list of innovative startups across various industries. Find your next investment or partnership opportunity.',
    openGraph: {
      images: [
        {
          url: 'https://production-start-up-directory.vercel.app/seo/images/startups-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Discover Startups',
        }
      ],
    }
  },
  investors: {
    title: 'Connect with Investors - Startup Directory',
    description: 'Find investors looking for the next breakthrough opportunity. Connect with VCs, angel investors, and more.',
    openGraph: {
      images: [
        {
          url: 'https://production-start-up-directory.vercel.app/seo/images/investors-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Connect with Investors',
        }
      ],
    }
  },
  about: {
    title: 'About Us - Startup Directory',
    description: 'Learn about our mission to connect innovative startups with the resources they need to succeed.',
    openGraph: {
      images: [
        {
          url: 'https://production-start-up-directory.vercel.app/seo/images/about-og.jpg',
          width: 1200,
          height: 630,
          alt: 'About Startup Directory',
        }
      ],
    }
  },
  dashboard: {
    title: 'Dashboard - Startup Directory',
    description: 'Manage your startup profile, track engagement, and connect with potential investors.',
    openGraph: {
      images: [
        {
          url: 'https://production-start-up-directory.vercel.app/seo/images/dashboard-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Startup Directory Dashboard',
        }
      ],
    }
  },
  login: {
    title: 'Login - Startup Directory',
    description: 'Log in to your Startup Directory account to manage your profile and connections.',
    openGraph: {
      images: [
        {
          url: 'https://production-start-up-directory.vercel.app/seo/images/login-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Login to Startup Directory',
        }
      ],
    }
  },
  register: {
    title: 'Register - Startup Directory',
    description: 'Create a new account on Startup Directory to showcase your startup or discover investment opportunities.',
    openGraph: {
      images: [
        {
          url: 'https://production-start-up-directory.vercel.app/seo/images/register-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Register on Startup Directory',
        }
      ],
    }
  }
}

// Generate SEO config for a specific startup
export function generateStartupSEO(startup: {
  name: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  slug: string;
}) {
  const title = `${startup.name} - Startup Directory`;
  const description = startup.tagline || startup.description || `Learn more about ${startup.name} on Startup Directory.`;
  const url = `https://production-start-up-directory.vercel.app/startups/${startup.slug}`;
  const imageUrl = startup.logo_url || 'https://production-start-up-directory.vercel.app/seo/images/startup-default-og.jpg';
  
  return {
    title,
    description,
    canonical: url,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: startup.name,
        }
      ],
    },
    twitter: {
      cardType: 'summary_large_image',
    },
  };
} 