import {ISectionData}  from "./SectionData";
import portraitImgUrl from '../assets/1704245613526.jpg';

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
        body: "I'm Jack, a full-stack software engineer based out of Berlin. I have a passion for designing and implementing software that bridges business needs, regulatory requirements, and modern usability best practices, as well as mentoring and growing the skillsets and careers of my fellow engineers. I'm currently seeking a job as a software engineer that can help me continue to make an impact in these areas."
       });
       sectionData.bodyTextSections.push({
        title: "",
        body: "If you're hiring, looking to collaborate on a project, or just want to chat about anything you find on this site, feel free to shoot me an email or reach out to me on LinkedIn!"
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
            imagePath: portraitImgUrl,
            bodyTextSections: []
       };
       sectionData.bodyTextSections.push({
        title: "Epic - Team Lead",
        body: "From March 2021 to May 2024, I worked at Epic Systems, an industry-leading electronic health record development company, as a Software Developer Team Lead. As a Team Lead, I managed a team of nine developers, and owned several integrated areas of functionality. I lead my team through several periods of intense change in the healthcare industry, including the Covid-19 pandemic, the rise of generative AI, and several significant regulatory changes in the US healthcare system. I was primarily responsible for day-to-day load balancing across the team, ensuring ownership and execution of enhancement projects, and future vision and roadmap building in collaboration with company leadership and customer executives. I was also responsible for the growth of my team members, providing them regular feedback on their work and planning growth paths for them. I continued to work as a developer alongside these responsibilities, taking bug fixes, code review, and customer debugging for my areas of ownership, and developing several enhancements for customers in the UK and Norway."
       });
       sectionData.bodyTextSections.push({
        title: "Epic - Software Developer",
        body: "From June 2018 to March 2021, I worked at Epic Systems as a Software Developer. As a developer, I was primarily responsible for analyzing medical billing regulations for various countries in North America and Europe, designing UI and business logic to support those billing requirements, and then developing and maintaining that functionality. I primarily used React, Typescript, and C#, along with Epic’s unique backend infrastructure. I’m particularly proud of some rapid development I did to support charging for telehealth visits at the start of the Covid-19 pandemic, which is still used 1.5 million times per month today, as well as a development to support significant US physician billing changes for 2021, which is still used 3 million times per month more than three years later."
       });
       return sectionData;
    }

    private __getProjectsSection(): ISectionData{
        const sectionData: ISectionData = {
            buttonTitle: "Projects",
            imagePath: portraitImgUrl,
            bodyTextSections: []
       };
       sectionData.bodyTextSections.push({
        title: "This Site",
        body: "I used the development of this site to catch up on many of the additions to the modern web development experience I didn’t get to utilize at Epic. This site is implemented in React, primarily using React Bootstrap for the components of the site. I used Vite for local development server setup, and hosted the site using GitHub pages, using GitHub actions to deploy the site after commits from my local machine. "
       });
       return sectionData;
    }
}