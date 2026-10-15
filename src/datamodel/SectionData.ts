/**
 * Data model for various portions of the site
 */

export interface ISectionData{
    id: string; //anchor id, used for #links and navigation
    buttonTitle: string;
    group: SectionGroup;
    bodyTextSections: IBodyTextSection[];
}

export interface IBodyTextSection{
    title: string;
    subtitle?: string; //secondary line under the title, e.g. company, location, and dates
    body: string | JSX.Element;
    style: BodyBlockStyle;
    imagePath?: string;
    imageAlt?: string;
    links?: ILink[];
}

export interface ILink{
    label: string;
    href: string;
}

export interface IHighlight{
    value: string;
    label: string;
}

export enum BodyBlockStyle{
    titleBlock,
    contentBlock,
    imageBlock
}

export enum SectionGroup{
    work,
    personal
}
