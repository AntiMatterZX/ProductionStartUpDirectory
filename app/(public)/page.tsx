"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MotionDiv, MotionSection, MotionH1, MotionP, MotionImg } from "@/components/ui/motion"
import { 
  ArrowRight, 
  BarChart2, 
  Globe, 
  Lightbulb, 
  Users, 
  ShieldCheck, 
  Rocket, 
  TrendingUp,
  CheckCircle2
} from "lucide-react"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  FiArrowUpRight,
  FiBell,
  FiCheck,
  FiChevronDown,
  FiList,
  FiMessageCircle,
  FiUser,
} from "react-icons/fi"
import {
  SiNike,
  Si3M,
  SiAbstract,
  SiAdobe,
  SiAirtable,
  SiAmazon,
  SiBox,
  SiBytedance,
  SiChase,
  SiCloudbees,
  SiBurton,
  SiBmw,
  SiHeroku,
  SiBuildkite,
  SiCouchbase,
  SiDailymotion,
  SiDeliveroo,
  SiEpicgames,
  SiGenius,
  SiGodaddy,
} from "react-icons/si"

export default function HomePage() {
  const statsRef = useRef(null)
  const featuresRef = useRef(null)
  const testimonialsRef = useRef(null)
  const ctaRef = useRef(null)

  const statsInView = useInView(statsRef, { once: true, amount: 0.2 })
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 })
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.2 })
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.2 })

  return (
    <>
      {/* Hero Section */}
      <section className="overflow-hidden bg-background">
        <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-6 md:px-12 pb-48 pt-12 md:pt-24">
          {/* Announcement Banner */}
          <div className="mb-1.5 rounded-full bg-zinc-600">
            <a
              href="#"
              target="_blank"
              rel="nofollow"
              className="flex origin-top-left items-center rounded-full border border-zinc-900 bg-white dark:bg-zinc-800 dark:border-zinc-700 p-0.5 text-sm transition-transform hover:-rotate-2"
            >
              <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-white">
                NEW
              </span>
              <span className="ml-1.5 mr-1 inline-block dark:text-zinc-200">
                Just launched on Product Hunt!
              </span>
              <FiArrowUpRight className="mr-2 inline-block dark:text-zinc-200" />
            </a>
          </div>

          {/* Heading and Description */}
          <h1 className="max-w-4xl text-center text-4xl font-black leading-[1.15] md:text-6xl md:leading-[1.15] gradient-heading mt-8">
            Where Startups Connect With Ideal Investors
          </h1>
          <p className="mx-auto my-4 max-w-3xl text-center text-base text-muted-foreground leading-relaxed md:my-6 md:text-xl md:leading-relaxed">
            VentureConnect is the premier platform for startups to showcase innovations 
            and connect with investors looking for the next breakthrough opportunity.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/signup">
              <Button size="lg" className="rounded-lg px-6 py-3 shadow-lg hover:shadow-primary/20 bg-primary text-white">
                <span className="font-bold">Get started</span> - no CC required
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/startups">
              <Button variant="outline" size="lg" className="rounded-lg px-6 py-3">
                Browse Startups
              </Button>
            </Link>
          </div>

          {/* Mockup Screen */}
          <div className="absolute bottom-0 left-1/2 h-48 md:h-56 lg:h-64 w-[calc(100vw_-_56px)] max-w-[1100px] -translate-x-1/2 translate-y-1/4 overflow-hidden rounded-t-xl bg-zinc-900 p-0.5 shadow-xl border border-zinc-700">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-0.5">
                <span className="size-2 rounded-full bg-red-400" />
                <span className="size-2 rounded-full bg-yellow-400" />
                <span className="size-2 rounded-full bg-green-400" />
              </div>
              <span className="rounded bg-zinc-600 px-2 py-0.5 text-xs text-zinc-100">
                ventureconnect.com/dashboard
              </span>
              <FiChevronDown className="text-white" />
            </div>
            <div className="relative z-0 grid h-full w-full grid-cols-[100px,_1fr] overflow-hidden rounded-t-lg bg-white dark:bg-zinc-900 md:grid-cols-[150px,_1fr]">
              <div className="h-full border-r border-zinc-300 dark:border-zinc-700 p-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm">VentureConnect</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-primary">
                    <FiMessageCircle />
                    <span>Messages</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs dark:text-zinc-400">
                    <FiCheck />
                    <span>Tasks</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs dark:text-zinc-400">
                    <FiList />
                    <span>Board</span>
                  </span>
                </div>
              </div>

              <div className="relative z-0 p-2">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-1 pr-8 text-xs text-zinc-600 dark:text-zinc-400">
                    Search startups...
                  </span>
                  <div className="flex items-center gap-1.5 text-xl">
                    <FiBell className="text-primary" />
                    <FiUser className="dark:text-zinc-400" />
                  </div>
                </div>
                <div className="h-full rounded-xl border border-dashed border-zinc-500 bg-zinc-100 dark:bg-zinc-800" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 top-0 z-10 bg-gradient-to-b from-white/0 to-white dark:from-zinc-900/0 dark:to-zinc-900" />
            </div>
          </div>
        </div>

        {/* Logo Carousel */}
        <div className="relative mt-44 md:mt-52 lg:mt-56 -rotate-1 scale-[1.01] border-y-2 border-zinc-900 dark:border-zinc-600 bg-white dark:bg-zinc-900">
          <div className="relative z-0 flex overflow-hidden border-b-2 border-zinc-900 dark:border-zinc-600">
            <LogosTop />
          </div>
          <div className="relative z-0 flex overflow-hidden">
            <LogosBottom />
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-32 bg-gradient-to-r from-white dark:from-zinc-900 to-white/0 dark:to-zinc-900/0" />
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-32 bg-gradient-to-l from-white dark:from-zinc-900 to-white/0 dark:to-zinc-900/0" />
        </div>
      </section>

      {/* Stats Section with 3D Box */}
      <section ref={statsRef} className="py-20 border-y bg-background/50 backdrop-blur-sm">
        <div className="container px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">The VentureConnect Journey</h2>
            <SpinningBoxText />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {[
                { number: "500+", label: "Startups" },
                { number: "200+", label: "Investors" },
                { number: "$50M+", label: "Funding Secured" },
                { number: "15+", label: "Countries" }
              ].map((stat, index) => (
                <MotionDiv
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </MotionDiv>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-gradient-to-b from-background to-accent/20">
        <div className="container px-4 sm:px-6">
          <MotionDiv
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block mb-4 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium">
              Simple yet powerful
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How VentureConnect Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform makes it seamless for startups and investors to connect, collaborate, and grow together.
            </p>
          </MotionDiv>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="h-12 w-12 text-primary" />,
                title: "Create Your Profile",
                description: "Sign up and build your founder or investor profile with your expertise and interests.",
                delay: 0.1,
              },
              {
                icon: <Rocket className="h-12 w-12 text-primary" />,
                title: "Showcase Your Startup",
                description: "Add your startup details, pitch deck, metrics, and media to stand out.",
                delay: 0.2,
              },
              {
                icon: <ShieldCheck className="h-12 w-12 text-primary" />,
                title: "Connect Securely",
                description: "Our verified network ensures you connect with legitimate partners.",
                delay: 0.3,
              },
              {
                icon: <TrendingUp className="h-12 w-12 text-primary" />,
                title: "Grow Together",
                description: "Form partnerships, secure investments, and scale your business.",
                delay: 0.4,
              },
            ].map((feature, index) => (
              <MotionDiv
                key={index}
                className="flex flex-col p-8 bg-card backdrop-blur-sm border rounded-xl hover-lift shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: feature.delay }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="mb-5 p-3 bg-primary/10 rounded-full w-fit">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-24 bg-background">
        <div className="container px-4 sm:px-6">
          <MotionDiv
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block mb-4 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium">
              Success stories
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from founders and investors who have found success on our platform.
            </p>
          </MotionDiv>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "VentureConnect helped us secure our seed round in just 60 days. The quality of investors and the streamlined process made all the difference.",
                author: "Sarah Johnson",
                role: "Founder, TechNova",
                image: "https://randomuser.me/api/portraits/women/44.jpg",
                delay: 0.1,
              },
              {
                quote: "As an investor, I've discovered some of my best performing startups through VentureConnect. The vetting process and detailed profiles save me countless hours.",
                author: "Michael Chen",
                role: "Partner, Horizon Ventures",
                image: "https://randomuser.me/api/portraits/men/54.jpg",
                delay: 0.2,
              },
              {
                quote: "The platform's analytics and pitch tools helped us refine our approach. We connected with three strategic investors who truly understand our industry.",
                author: "Rebecca Torres",
                role: "CEO, HealthAI",
                image: "https://randomuser.me/api/portraits/women/29.jpg",
                delay: 0.3,
              },
            ].map((testimonial, index) => (
              <MotionDiv
                key={index}
                className="flex flex-col p-8 bg-card backdrop-blur-sm border rounded-xl shadow-sm hover-lift h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: testimonial.delay }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="flex-1">
                  <div className="text-4xl text-primary mb-4">"</div>
                  <p className="text-muted-foreground mb-6 italic">
                    {testimonial.quote}
                  </p>
                </div>
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.author} 
                    className="w-12 h-12 rounded-full mr-4 border-2 border-primary"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${testimonial.author.replace(' ', '+')}&background=4F46E5&color=fff`
                    }}
                  />
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-accent">
        <div className="container px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <MotionDiv
              className="order-2 md:order-1"
              initial={{ opacity: 0, x: -20 }}
              animate={featuresInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose VentureConnect?</h2>
                  <p className="text-muted-foreground mb-8">
                    Our platform offers unique advantages for both startups and investors,
                    creating an ecosystem designed for successful connections.
                  </p>
                </div>
                
                {[
                  {
                    title: "Verified Profiles",
                    description: "All members undergo verification to ensure quality connections."
                  },
                  {
                    title: "Smart Matching",
                    description: "Our algorithm connects startups with relevant investors based on interests and goals."
                  },
                  {
                    title: "Secure Communication",
                    description: "Built-in tools for secure document sharing and communication."
                  },
                  {
                    title: "Ongoing Support",
                    description: "Access to resources, templates, and expert guidance throughout your journey."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </MotionDiv>
            
            <MotionDiv
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: 20 }}
              animate={featuresInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl blur opacity-30"></div>
                <div className="relative bg-card rounded-2xl overflow-hidden border shadow-lg">
                  <div className="p-1 bg-gradient-to-r from-primary to-indigo-600">
                    <div className="h-2"></div>
                  </div>
                  <div className="p-8">
                    <img
                      src="/matching-preview.png"
                      alt="Smart Matching Interface"
                      className="w-full h-auto rounded-lg shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/600x400/4f46e5/ffffff?text=Smart+Matching"
                      }}
                    />
                    <div className="mt-6 space-y-3">
                      <div className="h-4 bg-muted rounded-full w-full"></div>
                      <div className="h-4 bg-muted rounded-full w-3/4"></div>
                      <div className="h-4 bg-muted rounded-full w-5/6"></div>
                      <div className="h-4 bg-muted rounded-full w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaRef} 
        className="py-24 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        
        <div className="container px-4 sm:px-6 relative">
          <MotionDiv
            className="max-w-3xl mx-auto text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to transform your startup journey?</h2>
            <p className="text-primary-foreground text-lg opacity-90 mb-10 max-w-xl mx-auto">
              Join thousands of founders and investors already using VentureConnect to create the next generation of successful companies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="rounded-full px-8 text-primary font-medium shadow-xl h-12"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/startups">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full px-8 text-white border-white/30 backdrop-blur-sm bg-white/10 h-12"
                >
                  Explore Platform
                </Button>
              </Link>
            </div>
          </MotionDiv>
        </div>
      </section>
    </>
  )
}

// Logo carousel components
const LogosTop = () => {
  return (
    <>
      <motion.div
        initial={{ translateX: "0%" }}
        animate={{ translateX: "-100%" }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="flex px-2"
      >
        <LogoItem Icon={SiNike} name="Nike" />
        <LogoItem Icon={Si3M} name="3M" />
        <LogoItem Icon={SiAbstract} name="Abstract" />
        <LogoItem Icon={SiAdobe} name="Adobe" />
        <LogoItem Icon={SiAirtable} name="Airtable" />
        <LogoItem Icon={SiAmazon} name="Amazon" />
        <LogoItem Icon={SiBox} name="Box" />
        <LogoItem Icon={SiBytedance} name="Bytedance" />
        <LogoItem Icon={SiChase} name="Chase" />
        <LogoItem Icon={SiCloudbees} name="Cloudebees" />
      </motion.div>
      <motion.div
        initial={{ translateX: "0%" }}
        animate={{ translateX: "-100%" }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="flex px-2"
      >
        <LogoItem Icon={SiNike} name="Nike" />
        <LogoItem Icon={Si3M} name="3M" />
        <LogoItem Icon={SiAbstract} name="Abstract" />
        <LogoItem Icon={SiAdobe} name="Adobe" />
        <LogoItem Icon={SiAirtable} name="Airtable" />
        <LogoItem Icon={SiAmazon} name="Amazon" />
        <LogoItem Icon={SiBox} name="Box" />
        <LogoItem Icon={SiBytedance} name="Bytedance" />
        <LogoItem Icon={SiChase} name="Chase" />
        <LogoItem Icon={SiCloudbees} name="Cloudebees" />
      </motion.div>
      <motion.div
        initial={{ translateX: "0%" }}
        animate={{ translateX: "-100%" }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="flex px-2"
      >
        <LogoItem Icon={SiNike} name="Nike" />
        <LogoItem Icon={Si3M} name="3M" />
        <LogoItem Icon={SiAbstract} name="Abstract" />
        <LogoItem Icon={SiAdobe} name="Adobe" />
        <LogoItem Icon={SiAirtable} name="Airtable" />
        <LogoItem Icon={SiAmazon} name="Amazon" />
        <LogoItem Icon={SiBox} name="Box" />
        <LogoItem Icon={SiBytedance} name="Bytedance" />
        <LogoItem Icon={SiChase} name="Chase" />
        <LogoItem Icon={SiCloudbees} name="Cloudebees" />
      </motion.div>
    </>
  );
};

const LogosBottom = () => {
  return (
    <>
      <motion.div
        initial={{ translateX: "-100%" }}
        animate={{ translateX: "0%" }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="flex px-2"
      >
        <LogoItem Icon={SiBmw} name="BMW" />
        <LogoItem Icon={SiBurton} name="Burton" />
        <LogoItem Icon={SiBuildkite} name="Buildkite" />
        <LogoItem Icon={SiCouchbase} name="Couchbase" />
        <LogoItem Icon={SiDailymotion} name="Dailymotion" />
        <LogoItem Icon={SiDeliveroo} name="deliveroo" />
        <LogoItem Icon={SiEpicgames} name="Epic Games" />
        <LogoItem Icon={SiGenius} name="Genius" />
        <LogoItem Icon={SiGodaddy} name="GoDaddy" />
        <LogoItem Icon={SiHeroku} name="Heroku" />
      </motion.div>
      <motion.div
        initial={{ translateX: "-100%" }}
        animate={{ translateX: "0%" }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="flex px-2"
      >
        <LogoItem Icon={SiBmw} name="BMW" />
        <LogoItem Icon={SiBurton} name="Burton" />
        <LogoItem Icon={SiBuildkite} name="Buildkite" />
        <LogoItem Icon={SiCouchbase} name="Couchbase" />
        <LogoItem Icon={SiDailymotion} name="Dailymotion" />
        <LogoItem Icon={SiDeliveroo} name="deliveroo" />
        <LogoItem Icon={SiEpicgames} name="Epic Games" />
        <LogoItem Icon={SiGenius} name="Genius" />
        <LogoItem Icon={SiGodaddy} name="GoDaddy" />
        <LogoItem Icon={SiHeroku} name="Heroku" />
      </motion.div>
      <motion.div
        initial={{ translateX: "-100%" }}
        animate={{ translateX: "0%" }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="flex px-2"
      >
        <LogoItem Icon={SiBmw} name="BMW" />
        <LogoItem Icon={SiBurton} name="Burton" />
        <LogoItem Icon={SiBuildkite} name="Buildkite" />
        <LogoItem Icon={SiCouchbase} name="Couchbase" />
        <LogoItem Icon={SiDailymotion} name="Dailymotion" />
        <LogoItem Icon={SiDeliveroo} name="deliveroo" />
        <LogoItem Icon={SiEpicgames} name="Epic Games" />
        <LogoItem Icon={SiGenius} name="Genius" />
        <LogoItem Icon={SiGodaddy} name="GoDaddy" />
        <LogoItem Icon={SiHeroku} name="Heroku" />
      </motion.div>
    </>
  );
};

interface LogoItemProps {
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
}

const LogoItem = ({ Icon, name }: LogoItemProps) => {
  return (
    <span className="flex items-center justify-center gap-4 px-4 py-2 md:py-4">
      <Icon className="text-2xl text-indigo-600 dark:text-indigo-400 md:text-3xl" />
      <span className="whitespace-nowrap text-xl font-semibold uppercase md:text-2xl">
        {name}
      </span>
    </span>
  );
};

// Spinning Box Components
const SpinningBoxText: React.FC = () => {
  return (
    <span className="flex flex-col items-center justify-center gap-6 text-3xl md:text-5xl font-semibold md:flex-row md:gap-4">
      As simple as <Box front="Connect" bottom="Fund" back="Launch" top="Grow" />
    </span>
  );
};

const Box = ({ front, bottom, back, top }: { front: string; bottom: string; back: string; top: string }) => {
  return (
    <motion.span
      className="relative h-20 w-72 font-black uppercase"
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "center center -40px",
      }}
      initial={{ rotateX: "0deg" }}
      animate={{
        rotateX: [
          "0deg",
          "90deg",
          "90deg",
          "180deg",
          "180deg",
          "270deg",
          "270deg",
          "360deg",
        ],
      }}
      transition={{
        repeat: Infinity,
        duration: 10,
        ease: "backInOut",
        times: [0, 0.2, 0.25, 0.45, 0.5, 0.7, 0.75, 1],
      }}
    >
      {/* FRONT */}
      <span className="absolute flex h-full w-full items-center justify-center border-2 border-primary/30 bg-primary text-white">
        {front}
      </span>

      {/* BOTTOM */}
      <span
        style={{ transform: "translateY(5rem) rotateX(-90deg)" }}
        className="absolute flex h-full w-full origin-top items-center justify-center border-2 border-primary/30 bg-primary text-white"
      >
        {bottom}
      </span>

      {/* TOP */}
      <span
        style={{ transform: "translateY(-5rem) rotateX(90deg)" }}
        className="absolute flex h-full w-full origin-bottom items-center justify-center border-2 border-primary/30 bg-primary text-white"
      >
        {top}
      </span>

      {/* BACK */}
      <span
        style={{
          transform: "translateZ(-5rem) rotateZ(-180deg) rotateY(180deg)",
        }}
        className="absolute flex h-full w-full origin-center items-center justify-center border-2 border-primary/30 bg-primary text-white"
      >
        {back}
      </span>
    </motion.span>
  );
};
