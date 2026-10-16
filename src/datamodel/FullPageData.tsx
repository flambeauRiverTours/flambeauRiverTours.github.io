import { BodyBlockStyle, IHighlight, IProfile, ISectionData, SectionGroup } from "./SectionData";
import fantasyFootballImgUrl from '../assets/FantasyFootball.png';
import peruImgUrl from '../assets/Peru.jpg';
import koreaImgUrl from '../assets/Korea.jpg';
import japanImgUrl from '../assets/Japan.jpg';
import banffImgUrl from '../assets/Banff.jpg';
import australiaImgUrl from '../assets/Australia.jpg';
import creteImgUrl from '../assets/Crete.jpg';
import germanyImgUrl from '../assets/Germany.jpg';

/**
 * Renders a list of strings as a bulleted list
 * @param items The bullet points to show
 * @returns A JSX unordered list
 */
function bulletList(items: string[]): JSX.Element {
    return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

/**
 * Data model representing the full page
 */
export class FullPageData {
    //Section data maps button to page content
    private __sectionData: ISectionData[] = [];

    constructor() {
        this.__initializeSectionData();
    }

    /**
     * Gets the section data for the page
     * @returns The array of section data for the full page
     */
    public getSectionDataArray(): ISectionData[] {
        return this.__sectionData;
    }

    /**
     * Gets the name, role, and location shown in the hero
     * @returns The profile summary
     */
    public getProfile(): IProfile {
        return {
            name: "Jack Treadwell",
            role: "Senior Software Engineer · .NET, Azure & React",
            location: "Berlin, Germany · Relocating to Charlotte, NC in January 2027",
        };
    }

    /**
     * Gets the headline numbers shown at the top of the page
     * @returns The array of highlights
     */
    public getHighlights(): IHighlight[] {
        return [
            { value: "8 years", label: "building .NET and web software" },
            { value: "9", label: "developers led as a team lead at Epic" },
            { value: "3M / month", label: "uses of a charge calculation UI I built" },
            { value: "0% → 39%", label: "test coverage after I introduced automated testing at SPIE" },
        ];
    }

    /**
     * Sets up the static page data
     */
    private __initializeSectionData(): void {
        this.__sectionData.push(this.__getAboutMeSectionData());
        this.__sectionData.push(this.__getExperienceSection());
        this.__sectionData.push(this.__getProjectsSection());
        this.__sectionData.push(this.__getReadingListSection());
        this.__sectionData.push(this.__getTravelSection());
    }

    /**
     * Creates section data for the about me section
     * @returns Section data representing the about me section
     */
    private __getAboutMeSectionData(): ISectionData {
        const sectionData: ISectionData = {
            id: "about",
            buttonTitle: "About",
            group: SectionGroup.work,
            bodyTextSections: []
        };
        sectionData.bodyTextSections.push({
            title: "About",
            body: "I'm Jack, a senior software engineer with eight years of experience building .NET and web applications, most of it in healthcare billing and other regulated software. I enjoy turning complex rules into software that's a pleasure to use. Most of all, I enjoy working side by side with the users of my software, seeing where they struggle, and working with them to make improvements.",
            style: BodyBlockStyle.titleBlock,
        });
        sectionData.bodyTextSections.push({
            title: "",
            body: "I'm currently a Senior Software Engineer at SPIE in Berlin, where I'm helping migrate a large application for high-voltage power line design to modern .NET. Before that, I spent six years at Epic Systems focused on healthcare billing, including three years leading a team of nine developers.",
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            title: "",
            body: <p>I'm relocating to Charlotte, North Carolina, in January 2027. If you're hiring, looking to collaborate on a project, or just want to chat about anything you find on this site, feel free to <a href="mailto:jack.treadwell.dev@gmail.com">email me</a> or reach out on <a href="https://www.linkedin.com/in/john-treadwell/">LinkedIn</a>. You can also <a href="/Jack-Treadwell-Resume.pdf">download my resume (PDF)</a>.</p>,
            style: BodyBlockStyle.contentBlock,
        });
        return sectionData;
    }

    /**
     * Creates the section data for the Experience section
     * @returns SectionData representing the Experience section
     */
    private __getExperienceSection(): ISectionData {
        const sectionData: ISectionData = {
            id: "experience",
            buttonTitle: "Experience",
            group: SectionGroup.work,
            bodyTextSections: []
        };
        sectionData.bodyTextSections.push({
            title: "Experience",
            body: "",
            style: BodyBlockStyle.titleBlock,
        });
        sectionData.bodyTextSections.push({
            id: "experience-spie",
            title: "Senior Software Engineer",
            subtitle: "SPIE SAG GmbH · Berlin, Germany · Aug 2024 – Present",
            body: bulletList([
                "One of three engineers migrating a VB6 application of more than a million lines of code, used to model, design, and monitor high-voltage power lines, to .NET 10. The pilot has been released to target customers.",
                "Introduced automated testing and coached the team on TDD, establishing QA processes from scratch with xUnit, Moq, and Husky pre-commit and pre-push checks, and raising test coverage from 0% to 39% in two years.",
                "Designed and built a proprietary integration testing engine that validates core and customer-specific workflows locally and in CI, saving an estimated 20 hours of manual developer testing per week.",
                "Built GitLab CI/CD pipelines covering automated testing, security analysis with SonarQube and OSV-Scanner, SBOM generation with CycloneDX, code signing, and AxProtector protection, enabling weekly releases with builds under 10 minutes.",
            ]),
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            id: "experience-epic-lead",
            title: "Software Developer Team Lead",
            subtitle: "Epic Systems · Madison, WI · Mar 2021 – May 2024",
            body: bulletList([
                "Led and managed 9 developers building critical healthcare billing software, running day-to-day planning, 1:1s, performance reviews, onboarding, and coaching.",
                "Instituted triage and load-balancing processes to rapidly assess and fix bugs, delivering the highest-quality releases for our functionality in three years, as measured by high-priority issues traced to each release.",
                "Led technical strategy sessions with customer executives to understand their needs and design charging solutions, such as a charge calculator matching the updated 2021 E/M office-visit billing guidelines.",
                "Fixed 3x the company-wide median bug count while consistently delivering clean, unit-tested code.",
            ]),
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            id: "experience-epic-developer",
            title: "Software Developer",
            subtitle: "Epic Systems · Madison, WI · Jun 2018 – Mar 2021",
            body: bulletList([
                "Designed and implemented a charge calculation UI, based on government regulations and end-user feedback, that is used 3 million times per month.",
                "Architected a telehealth charging module on a rapid timeline at the start of the COVID-19 pandemic, now used 1.5 million times per month.",
                "Analyzed US and Norwegian changes in physician charging regulations, proposed solutions to impacted teams across Epic, and implemented them for my own team.",
                "Rapidly prototyped solutions while onsite in Norway, delivering a significant quality-of-life improvement to users outside the normal release schedule.",
            ]),
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            id: "experience-skills",
            title: "Skills",
            body: <dl className="skillList">
                <dt>Languages</dt><dd>C#, TypeScript, JavaScript, SQL, M (MUMPS)</dd>
                <dt>.NET &amp; Frontend</dt><dd>.NET 10, WPF, MVVM, React, HTML/CSS</dd>
                <dt>Testing</dt><dd>xUnit, Moq, unit &amp; integration testing, TDD</dd>
                <dt>CI/CD &amp; DevOps</dt><dd>GitLab CI/CD, GitHub Actions, Azure DevOps, Git, SonarQube, OSV-Scanner, SBOM (CycloneDX)</dd>
                <dt>Cloud</dt><dd>Azure (Functions, Static Web Apps, SQL, Blob Storage), Bicep</dd>
            </dl>,
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            id: "experience-certifications",
            title: "Certifications & Education",
            body: bulletList([
                "Microsoft Certified: AZ-400, Designing and Implementing Microsoft DevOps Solutions (2026)",
                "Professional Scrum Master I, Scrum.org",
                "BS in Physics and Computer Science, cum laude, Wake Forest University (2018)",
            ]),
            style: BodyBlockStyle.contentBlock,
        });
        return sectionData;
    }

    /**
     * Creates the SectionData for the Projects section
     * @returns SectionData representing the Projects section
     */
    private __getProjectsSection(): ISectionData {
        const sectionData: ISectionData = {
            id: "projects",
            buttonTitle: "Projects",
            group: SectionGroup.work,
            bodyTextSections: []
        };
        sectionData.bodyTextSections.push({
            title: "Projects",
            body: <p>Below are some of the projects I work on in my free time, listed in reverse chronological order. You can find most of them on my <a href="https://github.com/flambeauRiverTours">GitHub</a>.</p>,
            style: BodyBlockStyle.titleBlock,
        });
        sectionData.bodyTextSections.push({
            id: "projects-fantasy-football",
            title: "Real-Time Fantasy Football Scoreboard",
            subtitle: "Aug – Oct 2026 · .NET 10, React, Azure",
            body: "A live leaderboard and analytics site for my fantasy football league. It pairs a React frontend with a .NET 10 backend on Azure Functions and Static Web Apps, uses Blob and SQL storage, and deploys through GitHub Actions. It keeps scores current while running for about $0.25 a month. The write-up covers the architecture, the constraints I designed around, and the problems I solved along the way.",
            style: BodyBlockStyle.imageBlock,
            imagePath: fantasyFootballImgUrl,
            imageAlt: "The fantasy football leaderboard, showing the standings and consistency panels",
            links: [
                { label: "Live site", href: "https://ff.jacktreadwell.com" },
                { label: "Write-up", href: "https://jacktreadwell.com/FantasyFootballWebsite/" },
                { label: "Code", href: "https://github.com/flambeauRiverTours/FantasyFootballWebsite" },
            ],
        });
        sectionData.bodyTextSections.push({
            id: "projects-tidbyt",
            title: "Tidbyt Berlin Transit App",
            subtitle: "2024 · Open source · Starlark, REST APIs",
            body: <p>I've had a <a href="https://tidbyt.com/">Tidbyt</a> for a number of years, and as a user of public transit in Berlin, I wanted to see upcoming departures on it. So I built an app that pulls train timing and departure data from the VBB transit authority and displays it in a user-friendly way. It was a great opportunity to contribute to an open-source project, and good practice working with RESTful APIs.</p>,
            style: BodyBlockStyle.contentBlock,
            links: [
                { label: "Merged pull request", href: "https://github.com/tidbyt/community/pull/2518" },
            ],
        });
        return sectionData;
    }

    /**
     * Creates the SectionData for the Reading List section
     * @returns SectionData representing the Reading List section
     */
    private __getReadingListSection(): ISectionData {
        const sectionData: ISectionData = {
            id: "reading",
            buttonTitle: "Reading",
            group: SectionGroup.personal,
            bodyTextSections: []
        };
        sectionData.bodyTextSections.push({
            title: "Reading List",
            body: "This is my little journal of books I've read recently that I found particularly interesting, motivating, or just entertaining. They're listed in reverse chronological order, and I try to add a book every few weeks. I generally read on my Kindle Paperwhite and borrow e-books from my local library.",
            style: BodyBlockStyle.titleBlock,
        });
        sectionData.bodyTextSections.push({
            title: "Malazan Book of the Fallen",
            body: "I devoured the Malazan Book of the Fallen series this year. I found the way Erikson trickles out crucial world-building details without ever spoon-feeding the reader to be so enjoyable — the way my conception of his world changed throughout the series kept me engaged.",
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            title: "1491: New Revelations of the Americas Before Columbus",
            body: "I read 1491 for the first time this year, and I was struck by how much it challenged my assumptions about pre-Columbian America. I found the author's argument about the scale and complexity of Indigenous civilizations to be compelling, and it really made me examine the Indigenous history I was taught in school.",
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            title: "Autumn in the Heavenly Kingdom",
            body: "I went into this book with little knowledge of the Chinese Civil War. As a result, I found the book to be a fascinating and informative read. Platt's contextualization of the events of the war within the broader goings-on of the time period was a particular highlight — before reading this book, I would've thought it was a joke if you'd told me that China was in some way involved in the American Civil War, but this book shows the impact this conflict had, in particular through contrasting Britain's handling of these wars as they occurred simultaneously. This was a bit dense at times, but definitely worth the read.",
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            title: "Cat's Cradle",
            body: "Somewhat surprisingly, I've read very little Vonnegut. I immensely enjoyed the dark humor laced throughout the novel, and, having recently watched Oppenheimer, I found the usage of ice-nine to satirize nuclear weapons and the nuclear arms race to be genius. I also found that the narrator's awkward traversal of social situations hit a little too close to home sometimes.",
            style: BodyBlockStyle.contentBlock,
        });
        return sectionData;
    }

    /**
     * Creates the SectionData for the Travel section
     * @returns SectionData representing the Travel section
     */
    private __getTravelSection(): ISectionData {
        const sectionData: ISectionData = {
            id: "travel",
            buttonTitle: "Travel",
            group: SectionGroup.personal,
            bodyTextSections: []
        };
        sectionData.bodyTextSections.push({
            title: "Travel",
            body: "I love to travel, and I've been lucky enough to visit 15 countries and 5 continents so far. I've included some of my favorite trips below, and I'm always looking for new places to explore.",
            style: BodyBlockStyle.titleBlock,
        });
        sectionData.bodyTextSections.push({
            title: "Germany",
            body: "One of my goals for 2026 is to visit all 16 (or 17, depending on who you ask) German states. So far I'm at 15, with only Saxony left.",
            style: BodyBlockStyle.imageBlock,
            imagePath: germanyImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "Crete",
            body: "I visited Crete in the summer of 2024 with my partner. We spent three days in Chania and enjoyed the beautiful beaches, the delicious food, and the many historical sites. We especially enjoyed our evening at a winery in the hills outside Chania, where we learned about the native Cretan grape varietals.",
            style: BodyBlockStyle.imageBlock,
            imagePath: creteImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "Japan",
            body: "I visited Japan in 2023 with my partner, and we had an amazing time. We spent time in Tokyo, Kyoto, Osaka, and Hiroshima, with day trips to Hakone, Nara, and Miyajima. We loved the food (especially the noodles) and the many museums we visited, and we enjoyed a baseball game in Tokyo so much that we went to another game in Hiroshima!",
            style: BodyBlockStyle.imageBlock,
            imagePath: japanImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "South Korea",
            body: "I visited South Korea in 2023 with my partner as part of the same trip on which we visited Japan. We visited Seoul, Busan, and Jeju, and enjoyed many great hikes, visits to museums and art galleries, and tours of historical sites. We loved the food in South Korea, especially the street food, banchan, and Korean BBQ.",
            style: BodyBlockStyle.imageBlock,
            imagePath: koreaImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "New Zealand & Australia",
            body: "We visited New Zealand and Australia in late 2022/early 2023. We especially enjoyed hiking Mt. Doom and touring Hobbiton in New Zealand, along with many delicious dinners of seafood and local wine. In Australia, we enjoyed Christmas lunch on the beach, New Year's fireworks at Sydney Harbour, and many holiday celebrations with my partner's family.",
            style: BodyBlockStyle.imageBlock,
            imagePath: australiaImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "Banff & Yoho National Parks",
            body: "We traveled to Banff and Yoho National Parks in Canada with my partner's uncle in the summer of 2022. We spent our days on breathtaking hikes and fly fishing in glacial streams, and we had an amazing time. We enjoyed evenings camping out and saw lots of interesting wildlife, including a moose calf.",
            style: BodyBlockStyle.imageBlock,
            imagePath: banffImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "Peru",
            body: "We traveled to Peru in the summer of 2019 with a group of family and friends. We spent a few days south of Lima, riding dune buggies through the desert and taking a boat ride to a seabird reserve, then flew up to Cusco for a hike up to Machu Picchu. We were especially lucky to be in the country when Peru won its semifinal in that year's Copa América, and got to join the celebrations with locals in Aguas Calientes.",
            style: BodyBlockStyle.imageBlock,
            imagePath: peruImgUrl
        });
        return sectionData;
    }
}
