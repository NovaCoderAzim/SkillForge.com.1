import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Terminal, Shield, ChevronRight, Layers, Code2, Play,
  CheckCircle, ArrowRight, X, Menu, Globe, Server, Lock,
  Sparkles, Users, Star, Plus, GraduationCap, Presentation,
  BarChart3, BookOpen, ArrowUp, ArrowUpRight, Github, Twitter, Linkedin
} from "lucide-react";

// ============================================================================
// 🎨 TYPES & DATA CONFIGURATION
// ============================================================================

type PricingPlan = {
  name: string;
  priceMonthly: string;
  priceYearly: string;
  description: string;
  features: string[];
  popular?: boolean;
};

type FAQ = {
  question: string;
  answer: string;
};

const NAV_LINKS = [
  { name: "For Students", href: "#features" },
  { name: "For Instructors", href: "#platform" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Institutions", href: "#pricing" },
];

const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Classroom",
    priceMonthly: "₹2,999",
    priceYearly: "₹29,990",
    description: "Perfect for independent tutors and small bootcamps.",
    features: [
      "Up to 100 Active Students",
      "Browser-based Code Execution",
      "Automated Grading System",
      "Basic Analytics Dashboard",
      "Email Support",
    ],
  },
  {
    name: "Department",
    priceMonthly: "₹9,999",
    priceYearly: "₹99,990",
    description: "Ideal for college departments scaling their digital labs.",
    popular: true,
    features: [
      "Up to 1,000 Active Students",
      "AWS Lambda C++/Java Execution",
      "Military-Grade AI Proctoring",
      "Advanced Performance Analytics",
      "Priority 24/7 Support",
      "Custom Subdomain",
    ],
  },
  {
    name: "Campus",
    priceMonthly: "Custom",
    priceYearly: "Custom",
    description: "Enterprise infrastructure for entire universities.",
    features: [
      "Unlimited Students",
      "Bulk CSV Auto-Enrollment",
      "Custom Instructor Hierarchy",
      "LMS / API Integrations",
      "White-labeled Platform",
      "Dedicated Account Manager",
    ],
  },
];

const FAQS: FAQ[] = [
  {
    question: "How does SkillForge help instructors save time?",
    answer: "SkillForge automates the tedious parts of teaching. Instructors can create assignments with hidden test cases, and our engine automatically grades student submissions instantly, providing a comprehensive performance dashboard.",
  },
  {
    question: "Do students need to install any software?",
    answer: "No! SkillForge provides a zero-setup environment. Our browser-based IDE allows students to write, run, and debug Python, Java, and C++ code directly on their laptops, tablets, or even Chromebooks.",
  },
  {
    question: "How does the AI Proctoring ensure exam integrity?",
    answer: "Our Smart Guard system uses client-side AI to monitor face presence, detect multiple people in the frame, and enforce strict full-screen rules. If a student switches tabs or looks away, violations are logged and can auto-terminate the exam.",
  },
  {
    question: "Can we track student performance over time?",
    answer: "Absolutely. The Instructor Command Center provides deep analytics on cohort performance, identifying which concepts students are struggling with the most, down to the specific lines of code.",
  },
  {
    question: "Is the platform scalable for thousands of concurrent users?",
    answer: "Yes. Our hybrid architecture offloads Python execution to the student's browser, while heavy languages are routed to our auto-scaling AWS Serverless infrastructure. We handle exam-day traffic spikes with zero lag.",
  },
];

const TESTIMONIALS = [
  {
    name: "Dr. Arvind Sharma",
    role: "Head of Computer Science, Tech University",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop",
    content: "We migrated our entire 2nd-year programming lab to SkillForge. The automated grading and proctoring saved our faculty hundreds of hours, and the infrastructure is incredibly stable.",
  },
  {
    name: "Priya Patel",
    role: "Computer Science Student",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop",
    content: "SkillForge completely changed how I practice. The platform is so clean and fast. Not having to set up environments locally means I can just focus on learning algorithms.",
  },
  {
    name: "David Kim",
    role: "Lead Instructor, CodeCamp",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop",
    content: "The seamless transition between assigning course material and tracking student code execution in real-time is brilliant. It's the most professional LMS I've ever used.",
  },
  {
    name: "Ananya Desai",
    role: "Bootcamp Graduate",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop",
    content: "The C++ compiler is blazing fast. I loved the dark-mode IDE interface; it felt exactly like using VS Code in a real tech job. Earning the verified certificate helped me land my first role.",
  },
];

const LOGOS = [
  "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
  "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
];

// ============================================================================
// 🌀 ANIMATION VARIANTS
// ============================================================================

const staggerWrap = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

// ============================================================================
// 🧩 SUB-COMPONENTS
// ============================================================================

const AccordionItem = ({ faq, isOpen, onClick }: { faq: FAQ, isOpen: boolean, onClick: () => void }) => {
  return (
    <div className="border-b border-gray-200 dark:border-white/10 overflow-hidden">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10 shrink-0 transition-colors group-hover:bg-gray-200 dark:group-hover:bg-white/10"
        >
          <Plus size={16} className={isOpen ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="pb-6 text-gray-600 dark:text-gray-400 leading-relaxed pr-12">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// 🚀 MAIN PAGE COMPONENT
// ============================================================================

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [activePlatformTab, setActivePlatformTab] = useState<"student" | "instructor">("student");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-gray-300 selection:text-black overflow-x-hidden">

      {/* ── SCROLL PROGRESS BAR ── */}
      <motion.div
        className="fixed top-0 left-0 h-[2px] z-[100] origin-left"
        style={{
          scaleX: scrollYProgress,
          background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
        }}
      />

      {/* ------------------------------------------------------------------------
          NAVIGATION BAR (Glassmorphic)
      ------------------------------------------------------------------------- */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${scrolled
          ? "bg-black/70 backdrop-blur-xl border-white/10 py-4 shadow-2xl"
          : "bg-transparent border-transparent py-6"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-300 flex items-center justify-center rounded-[6px] shadow-lg transition-transform group-hover:scale-105">
              <Layers className="text-black" size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Skill<span className="text-gray-400">Forge</span></span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full backdrop-blur-md shadow-sm">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate("/login")} className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2">
              Sign In
            </button>
            <button onClick={() => navigate("/register")} className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/10">
              Request Demo
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden absolute top-full left-0 w-full bg-[#0a0a0a] border-b border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col px-6 py-8 gap-6">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-gray-300 hover:text-white"
                  >
                    {link.name}
                  </a>
                ))}
                <div className="h-px bg-white/10 w-full my-2" />
                <button onClick={() => navigate("/login")} className="text-left text-lg font-medium text-gray-300">Sign In</button>
                <button onClick={() => navigate("/register")} className="bg-white text-black px-6 py-3 rounded-xl text-lg font-bold text-center">Request Demo</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ------------------------------------------------------------------------
          HERO SECTION (Dark to Gray Gradient)
      ------------------------------------------------------------------------- */}
      <section className="relative min-h-[100vh] pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-black via-[#111111] to-[#1a1a1a]">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-gray-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col items-center text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300 mb-8 backdrop-blur-xl shadow-lg"
          >
            <Sparkles size={14} className="text-purple-300" />
            <span> Where Instructors Teach &amp; Students Thrive</span>
            <span className="bg-white/10 text-white text-[10px] font-black px-2 py-0.5 rounded-full">NEW</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-8"
          >
            One Platform.
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
              Infinite Learning.{" "}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl leading-relaxed"
          >
            SkillForge is the bridge between{" "}
            <span className="text-white font-semibold">instructors who build &amp; guide</span>
            {" "}and{" "}
            <span className="text-white font-semibold">students who learn, code &amp; earn certificates</span>.
            {" "}One institution. One platform. Total clarity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <button onClick={() => navigate("/register")} className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              Partner with Us <ArrowRight size={20} />
            </button>
            <button className="w-full sm:w-auto bg-[#1a1a1a] text-white px-8 py-4 rounded-full font-bold text-lg border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Play size={18} /> Watch Demo
            </button>
          </motion.div>

          {/* Animated Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16 mt-10 mb-4"
          >
            {[
              { val: "12,400+", label: "Active Students" },
              { val: "340+", label: "Courses Delivered" },
              { val: "48+", label: "Partner Institutions" },
              { val: "99.9%", label: "Uptime SLA" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-black text-white">{s.val}</div>
                <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Hero Visual Mockup - Floating Image + IDE */}
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }}
            className="w-full max-w-5xl mt-24 relative"
          >
            {/* Background Image Layer */}
            <div className="absolute inset-0 -top-10 -bottom-10 z-0 opacity-30 rounded-[3rem] overflow-hidden blur-sm">
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2000&auto=format&fit=crop" alt="Students" className="w-full h-full object-cover" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#050505]/90 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black relative z-10 transform perspective-1000 rotateX-2">
              <div className="h-12 bg-white/5 flex items-center px-4 border-b border-white/10 justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                </div>
                <div className="text-xs font-mono text-gray-400 bg-white/5 px-4 py-1 rounded-full border border-white/5 flex items-center gap-2">
                  <Lock size={12} /> SkillForge Secure Arena
                </div>
                <div className="w-12"></div> {/* Spacer */}
              </div>
              <div className="flex h-[350px] md:h-[450px]">
                {/* Sidebar */}
                <div className="w-14 bg-white/5 border-r border-white/10 flex flex-col items-center py-6 gap-6 text-gray-500">
                  <BookOpen size={20} className="hover:text-white cursor-pointer" />
                  <Code2 size={20} className="text-white" />
                  <BarChart3 size={20} className="hover:text-white cursor-pointer" />
                </div>
                {/* Code Area */}
                <div className="flex-1 p-6 font-mono text-sm md:text-base leading-relaxed overflow-hidden relative">
                  <div className="flex">
                    <div className="text-gray-600 select-none pr-4 text-right border-r border-white/10 mr-4">
                      1<br />2<br />3<br />4<br />5
                    </div>
                    <div className="text-gray-300">
                      <span className="text-gray-500 italic"># Dynamic Programming - Student Submission</span><br />
                      <span className="text-blue-400">def</span> <span className="text-gray-100">fibonacci</span>(n):<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-500 italic"># Time Complexity: O(n)</span><br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">if</span> n &lt;= <span className="text-purple-400">1</span>:<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">return</span> n<br />
                    </div>
                  </div>

                  {/* Floating Action Button */}
                  <div className="absolute bottom-6 right-6 bg-white text-black px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <CheckCircle size={16} /> SUBMIT & GRADE
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------
          TRUSTED LOGOS (Light Transition)
      ------------------------------------------------------------------------- */}
      <div className="w-full bg-gradient-to-b from-[#1a1a1a] to-[#e4e4e7] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-8">Students from these companies trust SkillForge graduates</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 hover:opacity-70 transition-opacity duration-500">
            {LOGOS.map((logo, i) => (
              <img key={i} src={logo} alt="Company Logo" className="h-8 md:h-10 object-contain grayscale invert hover:grayscale-0 hover:invert-0 transition-all duration-500" />
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          BENTO GRID (FEATURES) - LIGHT MODE SECTION
      ------------------------------------------------------------------------- */}
      <section id="features" className="py-32 px-6 bg-[#e4e4e7] text-black relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={staggerWrap} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-20">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-black/5 border border-black/10 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
              ✦ Platform Capabilities
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tight mb-6">Built for the entire campus.</motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-600 max-w-2xl">
              Every role covered. Instructors build &amp; guide. Students learn, code, and earn. The institution tracks everything.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerWrap} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]"
          >
            {/* Card 1: Student Arena */}
            <motion.div variants={fadeUp} className="md:col-span-2 lg:col-span-2 row-span-2 rounded-[2rem] p-8 border border-white bg-white shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 z-0">
                <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop" alt="Coding" className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/20" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-lg">
                  <Terminal size={28} />
                </div>
                <h3 className="text-3xl font-black mb-4">Interactive Student Arena</h3>
                <p className="text-gray-600 text-lg leading-relaxed max-w-md">
                  Students learn by doing. Our zero-latency, browser-based IDE requires no setup. They can write, debug, and execute code instantly, keeping them focused on logic, not installation errors.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Auto Grading */}
            <motion.div variants={fadeUp} className="md:col-span-1 lg:col-span-2 row-span-1 rounded-[2rem] p-8 border border-white bg-white shadow-xl relative overflow-hidden group">
              <div className="relative z-10 flex items-start gap-6 h-full flex-col justify-center">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
                    <BarChart3 size={24} className="text-black" />
                  </div>
                  <h3 className="text-2xl font-black">Automated Grading</h3>
                </div>
                <p className="text-gray-600 text-base">Instructors save hundreds of hours. Create assignments with hidden test cases and let our engine evaluate student submissions instantly.</p>
              </div>
            </motion.div>

            {/* Card 3: Proctoring */}
            <motion.div variants={fadeUp} className="md:col-span-1 lg:col-span-1 row-span-1 rounded-[2rem] p-8 border border-white bg-white shadow-xl relative group">
              <div className="absolute top-4 right-4 text-red-500 bg-red-50 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Live
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 mb-4 mt-4">
                <Shield size={24} className="text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Proctoring</h3>
              <p className="text-gray-600 text-sm">Ensure academic integrity with client-side face detection and tab-lock technology.</p>
            </motion.div>

            {/* Card 4: Community */}
            <motion.div variants={fadeUp} className="md:col-span-2 lg:col-span-1 row-span-1 rounded-[2rem] p-8 border border-white bg-white shadow-xl relative group overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10"><Users size={150} /></div>
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 mb-4 relative z-10">
                <Presentation size={24} className="text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 relative z-10">Resource Library</h3>
              <p className="text-gray-600 text-sm relative z-10">Centralized notes, high-quality videos, and interactive curriculum all in one place.</p>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------
          INSTRUCTOR VS STUDENT VIEWS (Gradient Transition)
      ------------------------------------------------------------------------- */}
      {/* ── HOW THE RELATIONSHIP WORKS ── */}
      <div className="bg-[#e4e4e7] pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={staggerWrap} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <motion.h3 variants={fadeUp} className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-black">How Instructors &amp; Students Connect</motion.h3>
            <motion.p variants={fadeUp} className="text-gray-600 text-lg max-w-xl mx-auto">SkillForge creates a seamless feedback loop between both roles.</motion.p>
          </motion.div>
          <motion.div variants={staggerWrap} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <motion.div variants={fadeUp} className="bg-white rounded-3xl p-7 border border-gray-200 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-4"><Presentation size={22} className="text-white" /></div>
              <h4 className="text-lg font-black mb-2">Instructor Builds</h4>
              <p className="text-gray-500 text-sm leading-relaxed">Creates video lessons, notes, quizzes, live coding assignments and hidden test cases — then publishes the course to enrolled students.</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <ArrowRight size={28} className="text-gray-400 rotate-90 md:rotate-0" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:block">Assigns &amp; Monitors</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center shadow-2xl">
                <Layers size={28} className="text-white" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <ArrowRight size={28} className="text-gray-400 rotate-90 md:rotate-0" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:block">Reports &amp; Certifies</span>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white rounded-3xl p-7 border border-gray-200 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-4"><GraduationCap size={22} className="text-white" /></div>
              <h4 className="text-lg font-black mb-2">Student Learns</h4>
              <p className="text-gray-500 text-sm leading-relaxed">Watches lessons, completes assignments in a zero-setup browser IDE, gets instant AI grading — and earns a verified certificate on 100% completion.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <section id="platform" className="py-32 px-6 bg-gradient-to-b from-[#e4e4e7] via-[#f4f4f5] to-white text-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">A Tailored View for Every Role.</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Whether you teach or learn — SkillForge puts exactly the right tools in front of you.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center bg-white p-4 md:p-8 rounded-[2.5rem] shadow-2xl border border-gray-200">

            {/* Controls Left */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              <button
                onClick={() => setActivePlatformTab("student")}
                className={`p-6 rounded-3xl text-left transition-all border ${activePlatformTab === "student" ? "bg-black text-white shadow-xl scale-105" : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600"}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <GraduationCap size={24} className={activePlatformTab === "student" ? "text-white" : "text-black"} />
                  <h4 className="font-bold text-lg">For Students: The Arena</h4>
                </div>
                <p className={`text-sm ${activePlatformTab === "student" ? "text-gray-300" : "text-gray-500"}`}>A distraction-free IDE, progress tracking, and instant automated feedback on assignments.</p>
              </button>

              <button
                onClick={() => setActivePlatformTab("instructor")}
                className={`p-6 rounded-3xl text-left transition-all border ${activePlatformTab === "instructor" ? "bg-black text-white shadow-xl scale-105" : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600"}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Presentation size={24} className={activePlatformTab === "instructor" ? "text-white" : "text-black"} />
                  <h4 className="font-bold text-lg">For Instructors: Command Center</h4>
                </div>
                <p className={`text-sm ${activePlatformTab === "instructor" ? "text-gray-300" : "text-gray-500"}`}>Create courses, manage test cases, monitor live exams, and analyze cohort performance.</p>
              </button>
            </div>

            {/* Visualizer Right */}
            <div className="w-full lg:w-2/3 h-[450px] bg-gray-100 rounded-3xl border border-gray-200 relative overflow-hidden flex items-center justify-center p-2">
              <AnimatePresence mode="wait">
                {activePlatformTab === "student" ? (
                  <motion.div
                    key="student"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }}
                    className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-gray-300 bg-white flex flex-col"
                  >
                    {/* Fake Student Dashboard Header */}
                    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between">
                      <div className="flex items-center gap-4 text-sm font-bold"><Layers size={16} /> My Learning Path</div>
                      <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">ST</div></div>
                    </div>
                    {/* Fake Student Content */}
                    <div className="flex-1 p-6 bg-gray-50 flex gap-6">
                      <div className="w-2/3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-black text-xl mb-2">Data Structures 101</h3>
                        <div className="w-full bg-gray-200 h-2 rounded-full mb-6"><div className="w-[60%] bg-black h-2 rounded-full"></div></div>
                        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300 text-gray-400 font-mono text-sm">Video Player Placeholder</div>
                      </div>
                      <div className="w-1/3 flex flex-col gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex-1">
                          <h4 className="font-bold text-sm mb-4">Up Next</h4>
                          <div className="space-y-3">
                            <div className="h-8 bg-gray-100 rounded-md w-full"></div>
                            <div className="h-8 bg-gray-100 rounded-md w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="instructor"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }}
                    className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-gray-800 bg-[#0a0a0a] flex flex-col text-white"
                  >
                    {/* Fake Instructor Dashboard Header */}
                    <div className="h-14 bg-[#111] border-b border-white/10 flex items-center px-6 justify-between">
                      <div className="flex items-center gap-4 text-sm font-bold text-gray-300"><BarChart3 size={16} /> Instructor Analytics</div>
                      <button className="bg-white text-black px-3 py-1 rounded text-xs font-bold">Create Course</button>
                    </div>
                    {/* Fake Instructor Content */}
                    <div className="flex-1 p-6 flex gap-6">
                      <div className="w-1/4 flex flex-col gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                          <div className="text-3xl font-black">1,204</div>
                          <div className="text-xs text-gray-500 uppercase mt-1">Active Students</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                          <div className="text-3xl font-black text-green-400">94%</div>
                          <div className="text-xs text-gray-500 uppercase mt-1">Avg Pass Rate</div>
                        </div>
                      </div>
                      <div className="w-3/4 bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                        <h4 className="font-bold text-sm mb-4 text-gray-300">Recent Submissions (Live)</h4>
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gray-700"></div>
                                <span className="text-sm font-medium">Student_ID_{849 + i}</span>
                              </div>
                              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Auto-Graded: A+</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------
          PRICING (Transition back to Dark)
      ------------------------------------------------------------------------- */}
      <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-white via-gray-200 to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 pt-10">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-black">Infrastructure that scales.</h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">From single classrooms to entire university campuses, our pricing adapts to your institutional needs.</p>

            {/* Toggle */}
            <div className="inline-flex bg-white p-1 rounded-full border border-gray-300 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${billingCycle === "monthly" ? "bg-black text-white shadow-md" : "text-gray-500 hover:text-black"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${billingCycle === "yearly" ? "bg-black text-white shadow-md" : "text-gray-500 hover:text-black"}`}
              >
                Yearly <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mt-10">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-10 rounded-[2.5rem] border ${plan.popular ? "bg-black border-gray-800 text-white scale-105 shadow-2xl relative z-20" : "bg-white border-gray-200 text-black hover:border-gray-300 shadow-xl"} transition-colors flex flex-col h-full`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-200 to-white text-black px-6 py-1.5 rounded-full text-xs font-black tracking-widest shadow-md">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-black mb-3">{plan.name}</h3>
                <p className={`text-sm mb-8 min-h-[40px] ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>{plan.description}</p>
                <div className="mb-10">
                  <span className="text-5xl font-black">
                    {billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  {plan.priceMonthly !== "Free" && plan.priceMonthly !== "Custom" && <span className={plan.popular ? "text-gray-500 font-medium" : "text-gray-400 font-medium"}>/mo</span>}
                </div>

                <ul className="space-y-5 mb-10 flex-1">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                      <CheckCircle size={20} className={plan.popular ? "text-white shrink-0" : "text-black shrink-0"} />
                      <span className={plan.popular ? "text-gray-300" : "text-gray-600"}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 rounded-2xl font-bold transition-all text-lg ${plan.popular ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}`}>
                  {plan.priceMonthly === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------
          TESTIMONIALS (Dark Mode)
      ------------------------------------------------------------------------- */}
      <section id="testimonials" className="py-32 px-6 bg-[#0a0a0a] border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">Trusted by Educators & Learners.</h2>
            <p className="text-xl text-gray-500">Don't just take our word for it. See how SkillForge transforms education.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2rem] bg-[#111] border border-white/5 hover:bg-white/5 transition-colors relative group"
              >
                <div className="absolute top-8 right-8 text-gray-800 group-hover:text-gray-700 transition-colors">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                </div>
                <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, j) => <Star key={j} size={18} className="fill-white text-white" />)}
                </div>
                <p className="text-xl text-gray-300 mb-10 leading-relaxed relative z-10">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.image} alt={t.name} className="w-14 h-14 rounded-full object-cover grayscale border border-white/20" />
                  <div>
                    <h4 className="font-bold text-white text-lg">{t.name}</h4>
                    <span className="text-sm text-gray-500 font-medium">{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------
          FAQ (Dark Mode)
      ------------------------------------------------------------------------- */}
      <section id="faq" className="py-32 px-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-16 text-center text-white">Frequently asked questions</h2>
          <div className="border-t border-white/10">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                faq={faq}
                isOpen={openFaqIndex === i}
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------
          BOTTOM CTA (Dark Mode)
      ------------------------------------------------------------------------- */}
      <section className="py-32 px-6 relative overflow-hidden bg-black border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] pointer-events-none" />
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-4xl mx-auto text-center relative z-10">
          <div className="text-5xl mb-6"></div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-white">Ready to forge the future?</h2>
          <p className="text-xl text-gray-400 mb-5 max-w-2xl mx-auto">Join forward-thinking universities and bootcamps upgrading their digital infrastructure today.</p>
          <p className="text-sm text-gray-600 mb-12">No credit card required &middot; 7-day free trial &middot; Cancel anytime</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => navigate("/register")} className="bg-white text-black px-10 py-5 rounded-full font-black text-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3">
              Get Started Free <ArrowUpRight size={24} />
            </button>
            <button onClick={() => navigate("/login")} className="border border-white/20 text-white px-10 py-5 rounded-full font-black text-xl hover:bg-white/5 transition-all flex items-center justify-center gap-3">
              Sign In
            </button>
          </div>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------------
          FOOTER (Dark Mode)
      ------------------------------------------------------------------------- */}
      <footer className="border-t border-white/10 bg-[#050505] pt-24 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-white flex items-center justify-center rounded-[6px]">
                  <Layers className="text-black" size={18} strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">SkillForge</span>
              </div>
              <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-sm">
                The high-performance, cost-optimized learning infrastructure designed to bridge the gap between educators and developers.
              </p>
              <div className="flex gap-5">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition-all"><Twitter size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition-all"><Github size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition-all"><Linkedin size={18} /></a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Product</h4>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li className="hover:text-white cursor-pointer transition-colors">For Students</li>
                <li className="hover:text-white cursor-pointer transition-colors">For Instructors</li>
                <li className="hover:text-white cursor-pointer transition-colors">Pricing</li>
                <li className="hover:text-white cursor-pointer transition-colors">Enterprise</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Resources</h4>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li className="hover:text-white cursor-pointer transition-colors">Documentation</li>
                <li className="hover:text-white cursor-pointer transition-colors">Help Center</li>
                <li className="hover:text-white cursor-pointer transition-colors">Blog</li>
                <li className="hover:text-white cursor-pointer transition-colors">Case Studies</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600 font-medium">
            <p>© {new Date().getFullYear()} SkillForge Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
              All systems operational
            </div>
          </div>
        </div>
      </footer>

      {/* ⏫ SCROLL TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-4 bg-white text-black rounded-full shadow-2xl hover:bg-gray-200 transition-colors z-50 group"
          >
            <ArrowUp size={20} strokeWidth={3} className="group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}