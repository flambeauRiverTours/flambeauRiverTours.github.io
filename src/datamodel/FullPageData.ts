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
        title: "Lorem Ipsum",
        body: "Lorem Ipsum Lorem Ipsum"
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
            imagePath: '../src/assets/1704245613526.jpg',
            bodyTextSections: []
       };
       sectionData.bodyTextSections.push({
        title: "Lorem Ipsum",
        body: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum"
       });
       sectionData.bodyTextSections.push({
        title: "Lorem Ipsum",
        body: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum"
       });
       sectionData.bodyTextSections.push({
        title: "Lorem Ipsum",
        body: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum"
       });
       sectionData.bodyTextSections.push({
        title: "Lorem Ipsum",
        body: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum"
       });
       sectionData.bodyTextSections.push({
        title: "Lorem Ipsum",
        body: "Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsumum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum"
       });

       return sectionData;
    }
}