import portraitImgUrl from '../assets/1704245613526.jpg';
import careerImgUrl from '../assets/Laptop.jpg';
import projectImgUrl from '../assets/Code.jpg';
import cvPdfUrl from '../assets/CV - Jack Treadwell.pdf';

export interface KeyMetric {
  label: string;
  value: string;
  subtext: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId?: string;
  link?: string;
  badgeTag?: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  tagline: string;
  location: string;
  status: string;
  avatarUrl: string;
  cvUrl: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  executiveSummary: string[];
  metrics: KeyMetric[];
  certifications: CertificationItem[];
  skills: {
    category: string;
    items: string[];
  }[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  achievements: string[];
  skills: string[];
}

export interface CaseStudyItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  period: string;
  problemStatement: string;
  architectureSolution: string;
  impactMetrics: string[];
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  prUrl?: string;
  featured?: boolean;
}

export const personalInfo: PersonalInfo = {
  name: "Jack Treadwell",
  title: "Full-Stack Software Engineer & Engineering Leader",
  tagline: "Former Epic Systems Team Lead with 6+ years building high-concurrency enterprise systems, leading cross-functional teams, and architecting regulatory-compliant healthcare platforms.",
  location: "Berlin, Germany",
  status: "Open to Senior & Lead Engineering Roles",
  avatarUrl: portraitImgUrl,
  cvUrl: cvPdfUrl,
  email: "flambeaurivertours@gmail.com",
  githubUrl: "https://github.com/flambeauRiverTours",
  linkedinUrl: "https://linkedin.com",
  executiveSummary: [
    "Software Engineering Leader and Full-Stack Developer with over 6 years of experience building mission-critical enterprise applications and managing high-performing engineering teams. At Epic Systems, I led an engineering group of 9 developers owning core integrated healthcare modules through massive industry shifts and regulatory updates.",
    "My technical focus spans scalable full-stack web architectures (React, TypeScript, C# / .NET, SQL), high-throughput transactional backends, API design, and regulatory compliance. I pride myself on bridging business vision with technical implementation while mentoring developers to accelerate their career growth."
  ],
  metrics: [
    {
      value: "9",
      label: "Engineers Managed",
      subtext: "Direct leadership, sprint planning & career growth"
    },
    {
      value: "3M+",
      label: "Monthly Transactions",
      subtext: "High-throughput physician billing & regulatory engine"
    },
    {
      value: "6+ Yrs",
      label: "Enterprise Leadership",
      subtext: "Full-stack software engineering & architecture"
    },
    {
      value: "2",
      label: "Global Deployments",
      subtext: "International localized rollouts (UK & Norway)"
    }
  ],
  certifications: [
    {
      id: "cert-aws-sa",
      title: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      date: "2024",
      badgeTag: "Cloud Architecture"
    },
    {
      id: "cert-ckad",
      title: "Certified Kubernetes Application Developer (CKAD)",
      issuer: "Linux Foundation / CNCF",
      date: "2024",
      badgeTag: "DevOps & Containers"
    },
    {
      id: "cert-csm",
      title: "Certified ScrumMaster (CSM)",
      issuer: "Scrum Alliance",
      date: "2023",
      badgeTag: "Agile Leadership"
    }
  ],
  skills: [
    {
      category: "Frontend & UI Architecture",
      items: ["React", "TypeScript", "Tailwind CSS", "Vite", "Framer Motion", "JavaScript (ES6+)"]
    },
    {
      category: "Backend & Systems Architecture",
      items: ["C# / .NET", "Node.js", "RESTful APIs", "Relational DBs / SQL", "Microservices"]
    },
    {
      category: "Engineering Leadership & Process",
      items: ["Engineering Management", "Technical Mentorship", "Agile & Scrum", "Regulatory Compliance", "Product Roadmap"]
    }
  ]
};

export const careerData: ExperienceItem[] = [
  {
    id: "epic-team-lead",
    role: "Software Developer Team Lead",
    company: "Epic Systems",
    period: "Mar 2021 – May 2024",
    location: "Verona, WI / International",
    summary: "Led an engineering team of 9 developers owning multiple core integrated healthcare functional areas through major industry shifts.",
    achievements: [
      "Managed 9 software developers, balancing day-to-day workload, sprint execution, and technical career growth paths.",
      "Spearheaded core feature vision and product roadmap in collaboration with company leadership and executive customer stakeholders.",
      "Guided team through critical regulatory changes in US healthcare, the rise of generative AI integration, and Covid-19 pandemic response.",
      "Maintained active hands-on engineering contributions including core code reviews, architecture design, complex customer debugging, and international enhancements for UK and Norway healthcare clients."
    ],
    skills: ["Team Leadership", "Software Architecture", "Product Roadmap", "Mentorship", "React", "TypeScript", "C# / .NET", "EHR Systems"]
  },
  {
    id: "epic-software-developer",
    role: "Software Developer",
    company: "Epic Systems",
    period: "Jun 2018 – Mar 2021",
    location: "Verona, WI",
    summary: "Analyzed international medical billing regulations, designed intuitive UI and robust business logic, and delivered mission-critical healthcare applications.",
    achievements: [
      "Engineered rapid telehealth billing workflows at the onset of the Covid-19 pandemic, scaling to serve over 1.5M monthly transactions.",
      "Designed and delivered 2021 US physician billing regulatory updates, scaling to over 3M monthly transactions across US hospital systems.",
      "Analyzed complex billing regulations across North America and Europe to build compliant front-end interfaces and backend calculation services.",
      "Developed full-stack web applications using React, TypeScript, C#, and high-availability database infrastructure."
    ],
    skills: ["React", "TypeScript", "C#", "REST APIs", "Regulatory Compliance", "Full-Stack Development", "UI/UX Design"]
  }
];

export const caseStudiesData: CaseStudyItem[] = [
  {
    id: "case-study-high-concurrency-billing",
    title: "High-Concurrency Physician Billing & Regulatory Engine",
    subtitle: "Enterprise Healthcare Platform Scaling",
    category: "Distributed Systems & Regulatory Engine",
    period: "2021 - 2024",
    problemStatement: "Federal healthcare billing regulations required immediate real-time validation and processing across nationwide hospital networks processing millions of daily patient claims without introducing latency or data inconsistencies.",
    architectureSolution: "Architected high-throughput transactional backend services in C# / .NET and optimized database indexing. Developed responsive React/TypeScript administrative rule configuration UI allowing hospital administrators to customize rule sets dynamically.",
    impactMetrics: [
      "Scaled engine to reliably process 3M+ monthly transactions across top-tier health networks.",
      "Reduced claim validation latency by 35% under peak hospital load.",
      "Achieved 100% regulatory compliance audit pass rate for partner institutions."
    ],
    technologies: ["C# / .NET", "React", "TypeScript", "SQL", "High-Concurrency", "Regulatory Compliance"],
    featured: true
  },
  {
    id: "case-study-telehealth-scaling",
    title: "Telehealth & Remote Care Workflow Integration",
    subtitle: "Rapid Epidemic Crisis Response System",
    category: "Full-Stack Web Architecture",
    period: "2020 - 2021",
    problemStatement: "The sudden shift to remote care during the COVID-19 pandemic required rapid deployment of seamless virtual visit billing workflows to prevent healthcare revenue stream collapse.",
    architectureSolution: "Spearheaded rapid end-to-end full-stack integration connecting telehealth video sessions with automated billing claims and multi-tier patient portal notifications.",
    impactMetrics: [
      "Deployed crisis workflows within 3 weeks of federal emergency declaration.",
      "Supported over 1.5M monthly virtual visit transactions at peak utilization.",
      "Zero reported system downtime during nationwide rollouts."
    ],
    technologies: ["React", "TypeScript", "REST APIs", "C#", "System Integration"],
    featured: true
  },
  {
    id: "case-study-tidbyt",
    title: "Tidbyt Berlin Transit App",
    subtitle: "Open Source Smart Display Application",
    category: "Open Source Integration",
    period: "2024",
    problemStatement: "Commuters in Berlin needed real-time, low-friction visibility into live departure schedules across U-Bahn, S-Bahn, and bus networks on ambient pixel displays.",
    architectureSolution: "Engineered a memory-efficient Starlark application fetching live VBB transit API feeds, parsing schedule delays, and rendering crisp low-resolution pixel matrix UI layouts.",
    impactMetrics: [
      "Merged into official Tidbyt community repository serving public users.",
      "Sub-100ms API response parsing and optimized canvas rendering."
    ],
    technologies: ["Starlark", "REST APIs", "Open Source", "Git"],
    githubUrl: "https://github.com/tidbyt/community",
    prUrl: "https://github.com/tidbyt/community/pull/2518",
    featured: true
  }
];

export const sectionHeaderImages = {
  about: portraitImgUrl,
  career: careerImgUrl,
  projects: projectImgUrl,
};
