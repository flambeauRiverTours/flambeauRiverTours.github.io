/**
 * Data model for various portions of the site
 */

export interface ISectionData{
    buttonTitle: string;
    imagePath: string;
    bodyTextSections: IBodyTextSection[];
}

export interface IBodyTextSection{
    title: string;
    body: string | JSX.Element;
    style: BodyBlockStyle;
}

export enum BodyBlockStyle{
    titleBlock,
    contentBlock,
    imageBlock
}