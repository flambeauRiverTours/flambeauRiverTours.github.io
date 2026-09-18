import { personalInfo, careerData, caseStudiesData } from './portfolioData';

export interface AIResponse {
  answer: string;
  sourceTab?: 'about' | 'career' | 'projects';
  sourceTitle?: string;
  suggestedFollowUps?: string[];
}

export const QUICK_PROMPTS = [
  "How did Jack manage his team of 9 engineers?",
  "How did Jack scale physician billing to 3M+ transactions?",
  "What AWS and Kubernetes certifications does Jack hold?",
  "Tell me about Jack's full-stack technical architecture experience."
];

export function queryAIAssistant(userQuery: string): AIResponse {
  const query = userQuery.toLowerCase().trim();

  if (query.includes('team') || query.includes('manage') || query.includes('lead') || query.includes('9')) {
    const leadRole = careerData.find(c => c.id === 'epic-team-lead');
    return {
      answer: `As Software Developer Team Lead at Epic Systems (2021–2024), Jack managed a team of 9 software developers. He balanced day-to-day workload, sprint execution, and technical career growth paths while maintaining hands-on engineering contributions in C#, React, and TypeScript.`,
      sourceTab: 'career',
      sourceTitle: leadRole?.role,
      suggestedFollowUps: [
        "How did Jack scale physician billing to 3M+ transactions?",
        "What AWS and Kubernetes certifications does Jack hold?"
      ]
    };
  }

  if (query.includes('bill') || query.includes('3m') || query.includes('transaction') || query.includes('concurrency') || query.includes('scal')) {
    const billingCaseStudy = caseStudiesData.find(cs => cs.id === 'case-study-high-concurrency-billing');
    return {
      answer: `Jack architected high-throughput physician billing & regulatory validation engines handling 3M+ monthly transactions across nationwide hospital systems. He built high-performance C# / .NET backend calculation services and responsive React/TypeScript administrative rule configurators that reduced claim validation latency by 35%.`,
      sourceTab: 'projects',
      sourceTitle: billingCaseStudy?.title,
      suggestedFollowUps: [
        "How did Jack manage his team of 9 engineers?",
        "What AWS and Kubernetes certifications does Jack hold?"
      ]
    };
  }

  if (query.includes('cert') || query.includes('aws') || query.includes('kubernetes') || query.includes('ckad') || query.includes('cloud')) {
    const certList = personalInfo.certifications.map(c => `${c.title} (${c.issuer}, ${c.date})`).join(', ');
    return {
      answer: `Jack holds three professional credentials: ${certList}. He combines hands-on cloud architecture expertise with enterprise Agile team management.`,
      sourceTab: 'about',
      sourceTitle: 'Professional Certifications',
      suggestedFollowUps: [
        "Tell me about Jack's full-stack technical architecture experience.",
        "How did Jack manage his team of 9 engineers?"
      ]
    };
  }

  if (query.includes('telehealth') || query.includes('covid') || query.includes('remote') || query.includes('1.5m')) {
    const telehealthCaseStudy = caseStudiesData.find(cs => cs.id === 'case-study-telehealth-scaling');
    return {
      answer: `At the start of the COVID-19 pandemic, Jack engineered rapid telehealth billing integration connecting virtual video visits with automated claims processing, deploying the crisis system within 3 weeks and scaling to 1.5M+ monthly virtual visit transactions.`,
      sourceTab: 'projects',
      sourceTitle: telehealthCaseStudy?.title,
      suggestedFollowUps: [
        "How did Jack scale physician billing to 3M+ transactions?",
        "How did Jack manage his team of 9 engineers?"
      ]
    };
  }

  // Default Fallback
  return {
    answer: `Jack Treadwell is a Berlin-based Full-Stack Software Engineer & Engineering Leader with 6+ years of enterprise experience at Epic Systems. He managed 9 developers, architected systems handling 3M+ monthly transactions, and holds AWS, CKAD, and CSM certifications.`,
    sourceTab: 'about',
    sourceTitle: 'Executive Overview',
    suggestedFollowUps: [
      "How did Jack manage his team of 9 engineers?",
      "How did Jack scale physician billing to 3M+ transactions?",
      "What AWS and Kubernetes certifications does Jack hold?"
    ]
  };
}
