import portraitImgUrl from '../assets/1704245613526.jpg';
import careerImgUrl from '../assets/Laptop.jpg';
import projectImgUrl from '../assets/Code.jpg';
import bookImgUrl from '../assets/Reading.jpg';
import travelImgUrl from '../assets/Compass.jpg';
import peruImgUrl from '../assets/Peru.jpg';
import koreaImgUrl from '../assets/Korea.jpg';
import japanImgUrl from '../assets/Japan.jpg';
import banffImgUrl from '../assets/Banff.jpg';
import australiaImgUrl from '../assets/Australia.jpg';
import creteImgUrl from '../assets/Crete.jpg';
import cvPdfUrl from '../assets/CV - Jack Treadwell.pdf';

export interface PersonalInfo {
  name: string;
  title: string;
  location: string;
  status: string;
  avatarUrl: string;
  cvUrl: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  bioParagraphs: string[];
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

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  period: string;
  description: string;
  highlights: string[];
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  prUrl?: string;
  featured?: boolean;
}

export interface BookItem {
  id: string;
  title: string;
  author?: string;
  category: string;
  review: string;
}

export interface TravelItem {
  id: string;
  title: string;
  timeframe: string;
  description: string;
  imagePath: string;
  tags: string[];
}

export const personalInfo: PersonalInfo = {
  name: "Jack Treadwell",
  title: "Full-Stack Software Engineer & Engineering Leader",
  location: "Berlin, Germany",
  status: "Open to Software Engineering Opportunities",
  avatarUrl: portraitImgUrl,
  cvUrl: cvPdfUrl,
  email: "flambeaurivertours@gmail.com", // update or default contact
  githubUrl: "https://github.com/flambeauRiverTours",
  linkedinUrl: "https://linkedin.com",
  bioParagraphs: [
    "I'm Jack, a full-stack software engineer based out of Berlin. I have a passion for designing and implementing software that bridges business needs, regulatory requirements, and modern usability best practices, as well as mentoring and growing the skillsets and careers of my fellow engineers. I'm currently seeking a software engineering role where I can continue driving meaningful technical impact.",
    "This portfolio showcases my professional journey, featured projects, personal reading log, and travel experiences, as well as serving as a playground to keep my web development skills sharp with modern front-end architectures.",
    "Whether you're hiring, looking to collaborate on a project, or simply want to chat about anything you see here, feel free to reach out via email or connect on LinkedIn!"
  ],
  skills: [
    {
      category: "Frontend & UI Architecture",
      items: ["React", "TypeScript", "Tailwind CSS", "Vite", "Framer Motion", "JavaScript (ES6+)"]
    },
    {
      category: "Backend & Systems",
      items: ["C# / .NET", "Node.js", "RESTful APIs", "System Architecture", "SQL & Relational DBs"]
    },
    {
      category: "Leadership & Process",
      items: ["Engineering Leadership", "Technical Mentorship", "Agile & Sprint Planning", "Regulatory Compliance", "Product Roadmap"]
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
      "Managed 9 software developers, balancing day-to-day workload, sprint execution, and career growth paths.",
      "Spearheaded core feature vision and product roadmap in collaboration with company leadership and executive customer leadership.",
      "Guided the team through critical regulatory changes in US healthcare, the rise of generative AI, and Covid-19 pandemic response.",
      "Maintained active hands-on engineering contributions including bug fixes, code reviews, complex customer debugging, and international enhancements for UK and Norway healthcare clients."
    ],
    skills: ["Team Leadership", "Software Architecture", "Product Roadmap", "Mentorship", "React", "TypeScript", "C#", "EHR Systems"]
  },
  {
    id: "epic-software-developer",
    role: "Software Developer",
    company: "Epic Systems",
    period: "Jun 2018 – Mar 2021",
    location: "Verona, WI",
    summary: "Analyzed international medical billing regulations, designed intuitive UI and robust business logic, and delivered mission-critical healthcare applications.",
    achievements: [
      "Engineered rapid telehealth billing workflows at the onset of the Covid-19 pandemic, serving over 1.5M monthly transactions.",
      "Designed and delivered 2021 US physician billing regulatory updates, scaling to over 3M monthly transactions.",
      "Analyzed complex billing regulations across North America and Europe to build compliant front-end interfaces and backend services.",
      "Developed full-stack web applications using React, TypeScript, C#, and proprietary database infrastructure."
    ],
    skills: ["React", "TypeScript", "C#", "REST APIs", "Regulatory Compliance", "Full-Stack Development", "UI/UX Design"]
  }
];

export const projectsData: ProjectItem[] = [
  {
    id: "this-website",
    title: "Modern Interactive Portfolio",
    subtitle: "Personal Webpage & Design System",
    period: "2024",
    description: "A sleek, cutting-edge personal portfolio site designed with a modern glassmorphic aesthetic, system theme detection, fluid Framer Motion tab transitions, and an automated GitHub Actions deployment pipeline.",
    highlights: [
      "Built with React 18, TypeScript, and Vite for lightning-fast HMR and build performance.",
      "Styled using Tailwind CSS v4 with custom glassmorphism effects and automatic dark/light mode switching.",
      "Utilized Framer Motion for smooth tab transitions and micro-interactions.",
      "Automated CI/CD build and static hosting deployment to GitHub Pages via GitHub Actions."
    ],
    technologies: ["React 18", "TypeScript", "Tailwind CSS", "Vite", "Framer Motion", "GitHub Actions"],
    githubUrl: "https://github.com/flambeauRiverTours/flambeaurivertours.github.io",
    featured: true
  },
  {
    id: "tidbyt-transit",
    title: "Tidbyt Berlin Transit App",
    subtitle: "Open Source Smart Display Application",
    period: "2024",
    description: "An open-source Tidbyt display application that fetches real-time departure and schedule data from the VBB (Verkehrsverbund Berlin-Brandenburg) transit authority and renders clean, easily readable transit updates.",
    highlights: [
      "Integrated real-time RESTful APIs from Berlin transit authorities.",
      "Engineered memory-efficient pixel UI layout for matrix display hardware.",
      "Contributed to the official Tidbyt community repository via open source Pull Request."
    ],
    technologies: ["Starlark", "REST APIs", "Open Source", "Git"],
    githubUrl: "https://github.com/tidbyt/community",
    prUrl: "https://github.com/tidbyt/community/pull/2518",
    featured: true
  }
];

export const booksData: BookItem[] = [
  {
    id: "battle-cry-freedom",
    title: "Battle Cry of Freedom: The Civil War Era",
    author: "James M. McPherson",
    category: "History",
    review: "An incredibly comprehensive retelling of the American Civil War. It maintains a strong, compelling narrative arc despite the expansive timeline and turmoil of the era. Particularly fascinating was the coverage of diplomatic incidents leading up to the war."
  },
  {
    id: "autumn-heavenly-kingdom",
    title: "Autumn in the Heavenly Kingdom",
    author: "Stephen R. Platt",
    category: "History",
    review: "A fascinating, deeply informative read on the Taiping Rebellion in China. Platt skillfully contextualizes these events alongside global affairs, contrasting Britain's simultaneous handling of conflicts in China and the American Civil War."
  },
  {
    id: "cats-cradle",
    title: "Cat's Cradle",
    author: "Kurt Vonnegut",
    category: "Fiction & Satire",
    review: "Immensely enjoyable dark humor throughout. The satire surrounding ice-nine as an allegory for nuclear proliferation was brilliant, and the narrator's awkward navigation of social dynamics hit close to home."
  },
  {
    id: "pageboy",
    title: "Pageboy",
    author: "Elliot Page",
    category: "Memoir",
    review: "A candid and poignant memoir. Page lays out the darkness and pain experienced throughout his journey with raw honesty. The resolution is uplifting, offering an insightful lens into evolving societal attitudes toward LGBTQIA+ rights."
  },
  {
    id: "rich-dad-poor-dad",
    title: "Rich Dad, Poor Dad",
    author: "Robert T. Kiyosaki",
    category: "Personal Finance",
    review: "An insightful perspective on financial mindsets. While not a strict blueprint, it brilliantly illustrates how intelligent, hard-working professionals can fall into financial traps, debunking common money myths along the way."
  }
];

export const travelData: TravelItem[] = [
  {
    id: "crete",
    title: "Crete, Greece",
    timeframe: "Summer 2024",
    description: "Explored Chania over three days enjoying sun-drenched beaches, local Cretan gastronomy, and historic sites, including an evening tasting native Cretan grape varietals at a hillside winery.",
    imagePath: creteImgUrl,
    tags: ["Greece", "Mediterranean", "Wine & Culinary"]
  },
  {
    id: "japan",
    title: "Japan",
    timeframe: "2023",
    description: "Traversed Tokyo, Kyoto, Osaka, and Hiroshima with day trips to Hakone, Nara, and Miyajima. Highlights included world-class ramen, museum tours, and attending thrilling baseball games in Tokyo and Hiroshima.",
    imagePath: japanImgUrl,
    tags: ["Japan", "East Asia", "Culture & Culinary"]
  },
  {
    id: "korea",
    title: "South Korea",
    timeframe: "2023",
    description: "Journeyed through Seoul, Busan, and Jeju Island featuring scenic hikes, contemporary art galleries, historical site tours, and memorable Korean BBQ and street food feasts.",
    imagePath: koreaImgUrl,
    tags: ["South Korea", "Hiking & Nature", "Food & Street Life"]
  },
  {
    id: "anz",
    title: "New Zealand & Australia",
    timeframe: "Late 2022 / Early 2023",
    description: "Hiked Mt. Doom and toured Hobbiton in New Zealand paired with local wine tastings. In Australia, celebrated Christmas on the beach and rang in the New Year under the Sydney Harbor fireworks.",
    imagePath: australiaImgUrl,
    tags: ["Oceania", "Trekking", "Coastal Holiday"]
  },
  {
    id: "banff",
    title: "Banff & Yoho National Parks",
    timeframe: "Summer 2022",
    description: "Spent days embarking on breathtaking glacial hikes and fly fishing in crystal streams in the Canadian Rockies. Evenings camping under the stars featured wildlife sightings including a young moose calf.",
    imagePath: banffImgUrl,
    tags: ["Canada", "National Parks", "Outdoors & Camping"]
  },
  {
    id: "peru",
    title: "Peru",
    timeframe: "Summer 2019",
    description: "Rode dune buggies through the Atacama desert near Huacachina, toured bird reserves, and trekked up to Machu Picchu. Joined locals in Aguas Calientes to celebrate Peru's Copa America semifinal victory.",
    imagePath: peruImgUrl,
    tags: ["South America", "Machu Picchu", "Adventure"]
  }
];

export const sectionHeaderImages = {
  about: portraitImgUrl,
  career: careerImgUrl,
  projects: projectImgUrl,
  reading: bookImgUrl,
  travel: travelImgUrl,
};
