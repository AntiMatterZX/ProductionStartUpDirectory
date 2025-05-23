# LaunchPad: Startup & Investor Connection Platform

<div align="center">
  <img src="public/images/launchpad-logo.png" alt="LaunchPad Logo" width="200">
  <p><strong>Connecting innovative startups with the right investors</strong></p>
</div>

## About LaunchPad

LaunchPad is a comprehensive platform designed to bridge the gap between promising startups and investors. Our goal is to create an ecosystem where startups can thrive by connecting them with the resources, mentorship, and funding they need to succeed.

## Features

- **Startup Profiles**: Create detailed profiles showcasing your team, product, market, and vision
- **Investor Matching**: Get matched with investors who align with your industry and stage
- **Resource Hub**: Access guides, templates, and resources for startup growth
- **Secure Communication**: Connect with potential investors through our secure messaging system
- **Dashboard Analytics**: Track profile views, investor interest, and engagement metrics
- **User-Friendly Interface**: Modern, intuitive design for seamless navigation

## Tech Stack

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Styling**: Tailwind CSS, Shadcn UI components
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/launchpad.git
   cd launchpad
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Documentation

- [User Documentation](/docs): Comprehensive guides for using LaunchPad
- [API Documentation](/docs/api): Swagger UI documentation for LaunchPad API
- [Contributing Guidelines](CONTRIBUTING.md): Guidelines for contributing to the project

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   ├── (auth)/           # Authentication routes
│   ├── dashboard/        # Dashboard pages
│   ├── admin/            # Admin panel
│   └── ...               # Other app routes
├── components/           # Reusable components
│   ├── ui/               # UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── ...               # Other components
├── lib/                  # Utility functions and shared code
│   ├── supabase/         # Supabase clients and utilities
│   └── utils.ts          # Utility functions
├── public/               # Static assets
├── styles/               # Global styles
└── ...                   # Configuration files
```

## Deployment

The application is designed to be deployed on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure your environment variables
3. Deploy!

## Contributing

We welcome contributions to LaunchPad! Please check out our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please reach out to:
- Email: support@launchpad.io
- Twitter: [@LaunchPadHQ](https://twitter.com/LaunchPadHQ)
