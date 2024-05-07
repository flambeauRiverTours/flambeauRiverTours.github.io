import {BodyBlockStyle, ISectionData}  from "./SectionData";
import portraitImgUrl from '../assets/1704245613526.jpg';
import careerImgUrl from '../assets/laptop-2298286_1280.png';
import projectImgUrl  from '../assets/code-1839406_1280.jpg';
import bookImgUrl from '../assets/reading-3723751_1920.jpg';
import travelImgUrl from '../assets/compass-7592447_1280.jpg';
import BodyTextSection from "./BodyTextSection";
import { RichBodyTextSectionFactory, RichBodyTextSections } from "./RichBodyTextSectionFactory";
import peruImgUrl from '../assets/Peru.jpg';
import koreaImgUrl from '../assets/Korea.jpg';
import japanImgUrl from '../assets/Japan.jpg';
import banffImgUrl from '../assets/Banff.jpg';
import australiaImgUrl from '../assets/Australia.jpg';

/**
 * Data model representing the full page
 */
export class FullPageData{
    //Section data maps button to page content
    private __sectionData: ISectionData[] = [];

    constructor(){
        this.__initializeSectionData();
    }

    /**
     * Getter for sidebar button captions
     * @returns An array of strings that should be used as the button captions in the sidebar
     */
    public getButtonTitles(): string[]{
        const buttonTitles: string[] = [];
        this.__sectionData.forEach((sectionData: ISectionData) =>{
            buttonTitles.push(sectionData.buttonTitle);
        })
        return buttonTitles;
    }

    /**
     * Gets the section data for the apge
     * @returns The array of section data for the full page
     */
    public getSectionDataArray(): ISectionData[]{
        return this.__sectionData;
    }

    /**
     * Sets up the static page data
     */
    private __initializeSectionData(): void{
       this.__sectionData.push(this.__getAboutMeSectionData());
       this.__sectionData.push(this.__getMyCareerSection())
       this.__sectionData.push(this.__getProjectsSection());
       this.__sectionData.push(this.__getReadingListSection());
       this.__sectionData.push(this.__getTravelSection());
    }

    /**
     * Creates section data for the about me section
     * @returns Section data representing the about me section
     */
    private __getAboutMeSectionData(): ISectionData{
        const sectionData: ISectionData = {
            buttonTitle: "About Me",
            imagePath: portraitImgUrl,
            bodyTextSections: []
       };
       sectionData.bodyTextSections.push({
        title: "About Me",
        body: "I'm Jack, a full-stack software engineer based out of Berlin. I have a passion for designing and implementing software that bridges business needs, regulatory requirements, and modern usability best practices, as well as mentoring and growing the skillsets and careers of my fellow engineers. I'm currently seeking a job as a software engineer that can help me continue to make an impact in these areas.",
        style: BodyBlockStyle.titleBlock,
       });
       sectionData.bodyTextSections.push({
        title: "",
        body: "If you're hiring, looking to collaborate on a project, or just want to chat about anything you find on this site, feel free to shoot me an email or reach out to me on LinkedIn!",
        style: BodyBlockStyle.contentBlock,
       });
       return sectionData;
    }

    /**
     * Creates the section data for the My Career section
     * @returns SectionData representing the My Career section
     */
    private __getMyCareerSection(): ISectionData{
        const sectionData: ISectionData = {
            buttonTitle: "My Career",
            imagePath: careerImgUrl,
            bodyTextSections: []
       };
       sectionData.bodyTextSections.push({
        title: "My Career",
        body: "",
        style: BodyBlockStyle.titleBlock,
        });
       sectionData.bodyTextSections.push({
        title: "Epic - Team Lead",
        body: "From March 2021 to May 2024, I worked at Epic Systems, an industry-leading electronic health record development company, as a Software Developer Team Lead. As a Team Lead, I managed a team of nine developers, and owned several integrated areas of functionality. I lead my team through several periods of intense change in the healthcare industry, including the Covid-19 pandemic, the rise of generative AI, and several significant regulatory changes in the US healthcare system. I was primarily responsible for day-to-day load balancing across the team, ensuring ownership and execution of enhancement projects, and future vision and roadmap building in collaboration with company leadership and customer executives. I was also responsible for the growth of my team members, providing them regular feedback on their work and planning growth paths for them. I continued to work as a developer alongside these responsibilities, taking bug fixes, code review, and customer debugging for my areas of ownership, and developing several enhancements for customers in the UK and Norway.",
        style: BodyBlockStyle.contentBlock,
        });
       sectionData.bodyTextSections.push({
        title: "Epic - Software Developer",
        body: "From June 2018 to March 2021, I worked at Epic Systems as a Software Developer. As a developer, I was primarily responsible for analyzing medical billing regulations for various countries in North America and Europe, designing UI and business logic to support those billing requirements, and then developing and maintaining that functionality. I primarily used React, Typescript, and C#, along with Epic’s unique backend infrastructure. I’m particularly proud of some rapid development I did to support charging for telehealth visits at the start of the Covid-19 pandemic, which is still used 1.5 million times per month today, as well as a development to support significant US physician billing changes for 2021, which is still used 3 million times per month more than three years later.",
        style: BodyBlockStyle.contentBlock,
        });
       return sectionData;
    }

    /**
     * Creates the SectionData for the Projects section
     * @returns SectionData representing the Projects section
     */
    private __getProjectsSection(): ISectionData{
        const sectionData: ISectionData = {
            buttonTitle: "Projects",
            imagePath: projectImgUrl,
            bodyTextSections: []
       };

       const projectsTitleBlock = new BodyTextSection();
       projectsTitleBlock.title = "Projects";
       projectsTitleBlock.style = BodyBlockStyle.titleBlock;
       projectsTitleBlock.body = RichBodyTextSectionFactory.getBodyTextJSX(RichBodyTextSections.ProjectsTitle);
       sectionData.bodyTextSections.push(projectsTitleBlock);
       
       const thisSiteBlock = new BodyTextSection();
       thisSiteBlock.title = "This Site",
       thisSiteBlock.style = BodyBlockStyle.contentBlock;
       thisSiteBlock.body = RichBodyTextSectionFactory.getBodyTextJSX(RichBodyTextSections.ProjectsWebpage);
       sectionData.bodyTextSections.push(thisSiteBlock);
       return sectionData;
    }

    /**
     * Creates the SectionData for the Reading List section
     * @returns SectionData representing the Reading List section
     */
    private __getReadingListSection(): ISectionData
    {
        const sectionData: ISectionData = {
            buttonTitle: "Reading List",
            imagePath: bookImgUrl,
            bodyTextSections: []
        };
        sectionData.bodyTextSections.push({
            title: "Reading List",
            body: "This is my little journal of books I've read recently that I found particularly interesting, motivating, or just entertaining. They're listed out reverse chronologically, and I try to add a book every few weeks. I generally read on my Kindle Paperwhite, and borrow e-books from the South Central Wisconsin Library System.",
            style: BodyBlockStyle.titleBlock,
        });
        sectionData.bodyTextSections.push({
            title: "Cat's Craddle",
            body: "Somewhat surprisingly, I've read very little Vonnegut. I immensley enjoyed the dark humor laced throughout the novel, and, having recently watched  Oppenheimer, I found the usage of ice-nine to satirize nuclear weapons and the nuclear arms race to be genius. I also found the narrator's awkward traversal of social situations hit a little too close to home sometimes.",
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            title: "Pageboy",
            body: "I hadn't followed Elliot Page's story much, outside of hearing that he was transitioning, and knowing him from Juno and Inception. His memoir was, at times, a difficult read, with Page clearly and sometimes bluntly outlaying the darkness and pain he's experienced throughout his life. The end is uplifting though, and I found Page's story to be a great opportunity to reflect on how attitudes towards LGBTQIA+ folks have changed over the course of my lifetime.",
            style: BodyBlockStyle.contentBlock,
        });
        sectionData.bodyTextSections.push({
            title: "Rich Dad, Poor Dad",
            body: "I'm not generally a motivational book sort of guy, but I picked this one up after seeing it recommended on some financial planning websites. I would not recommend it from a financial planning perspective - it seems like Kiyosaki, while a shrewd investor, mostly got lucky on a few bets - but I enjoyed how Kiyosaki illustrated how highly intelligent, driven people with good careers fail to make financial headway. I found his debunking of the common money myths that trap these sorts of people particularly valuable.",
            style: BodyBlockStyle.contentBlock,
        });
        return sectionData;
    }

    /**
     * Creates the SectionData for the Travel section
     * @returns SectionData representing the Travel section
     */
    private __getTravelSection(): ISectionData{
        const sectionData: ISectionData = {
            buttonTitle: "Travel",
            imagePath: travelImgUrl,
            bodyTextSections: []
        };
        sectionData.bodyTextSections.push({
            title: "Travel",
            body: "I love to travel, and I've been lucky enough to visit 15 countries and 5 continents so far. I've included some of my favorite trips below, and I'm always looking for new places to explore.",
            style: BodyBlockStyle.titleBlock,
        });
        sectionData.bodyTextSections.push({
            title: "Japan",
            body: "I visited Japan in 2023 with my partner, and we had an amazing time. We spent time in Tokyo, Kyoto, Osaka, and Hiroshima, with day trips to Hakone, Nara, and Miyajima. We loved the food (especially the noodles), the many museums we visited, and we loved our experiece at a baseball game in Tokyo so much that we went to another game in Hiroshima!",
            style: BodyBlockStyle.imageBlock,
            imagePath: japanImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "South Korea",
            body: "I visited South Korea in 2023 with my partner as part of the same trip on which we visited Japan. We visited Seoul, Busan, and Jeju, and enjoyed many great hikes, visits to museums and art galleries, and tours of historical sites. We loved the food in South Korea, especially the street food,banchan, and the Korean BBQ.",
            style: BodyBlockStyle.imageBlock,
            imagePath: koreaImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "New Zealand & Australia",
            body: "We visited New Zealand and Austalia in late 2022/early 2023. We especially enjoyed hiking Mt. Doom and touring Hobbiton in New Zealand, along with many delicious dinners of seafood and local wine. In Australia, we enjoyed Christmas lunch on the beach, New Years fireworks at the Sydney harbor, and many holiday celebrations with my partner's family.",
            style: BodyBlockStyle.imageBlock,
            imagePath: australiaImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "Banff & Yoho National Parks",
            body: "We traveled to Banff and Yoho National Parks in Canada with my partner's uncle in the summer of 2022. We spent our days on breathtaking hikes and flyfishing in glacial streams, and we had an amazing time. We enjoyed evenings camping out, and saw lots of interesting wildlife, including a moose calf.",
            style: BodyBlockStyle.imageBlock,
            imagePath: banffImgUrl
        });
        sectionData.bodyTextSections.push({
            title: "Peru",
            body: "We traveled to Peru in the summer of 2019 with a group of family and friends. We spent a few days south of Lima, riding dune buggies through the Atacama desert and taking a boatride to a seabird reserve, then flew up to Cusco for a hike up to Macchu Picchu. We were especially lucky to be in the country when Peru won in the semifinal of that year's Copa America, and got to goin the celebrations with locals in Aguas Calientes.",
            style: BodyBlockStyle.imageBlock,
            imagePath: peruImgUrl
        });
        return sectionData;
    }
}