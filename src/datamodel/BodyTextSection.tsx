/**
 * Implementation of IBodyTextSection, mostly implemented directly for ease of switching
 * between rich text body blocks that need JSX handling, and plaintext blocks that don't.
 */

import { BodyBlockStyle, IBodyTextSection } from "./SectionData";

export class BodyTextSection implements IBodyTextSection{
    private __title: string;
    private __body: JSX.Element;
    private __style: BodyBlockStyle;

    constructor() {
        this.__title = "";
        this.__body = <></>;
        this.__style = BodyBlockStyle.contentBlock;
    }   

    public get body(): JSX.Element{
        return this.__body;
    }

    public set body(value: string | JSX.Element){
        if (typeof(value) === "string"){
            this.__body = <p>{value}</p>;
        }
        else{
            this.__body = value;
        }
        
    }

    public get title(): string{
        return this.__title;
    }

    public set title(value: string) {
        this.__title = value;
    }

    public get style(): BodyBlockStyle{
        return this.__style;
    }

    public set style(value: BodyBlockStyle){
        this.__style = value;
    }
}

export default BodyTextSection;