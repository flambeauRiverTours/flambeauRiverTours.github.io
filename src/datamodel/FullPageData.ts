import {BodyBlockStyle, ISectionData}  from "./SectionData";
import portraitImgUrl from '../assets/1704245613526.jpg';
import careerImgUrl from '../assets/laptop-2298286_1280.png';
import projectImgUrl  from '../assets/code-1839406_1280.jpg';
import bookImgUrl from '../assets/reading-3723751_1920.jpg';
import BodyTextSection from "./BodyTextSection";
import { RichBodyTextSectionFactory, RichBodyTextSections } from "./RichBodyTextSectionFactory";

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
}