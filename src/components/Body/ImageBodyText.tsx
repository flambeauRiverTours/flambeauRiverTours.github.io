/**
 * Component to hold images and text within the body blocks of the page
 */

import { IBodyTextSection } from "../../datamodel/SectionData";
import Image from 'react-bootstrap/Image';
import { renderBody, renderLinks } from "./BodyContent";

function ImageBodyText(props: IImageBodyTextProps) {

    return (
        <div id={props.bodyTextSection.id} className="entry">
            <h3>{props.bodyTextSection.title}</h3>
            {props.bodyTextSection.subtitle ? <p className="entryMeta">{props.bodyTextSection.subtitle}</p> : null}
            {props.bodyTextSection.imagePath ?
                <Image src={props.bodyTextSection.imagePath} alt={props.bodyTextSection.imageAlt ?? props.bodyTextSection.title} className="entryImage" loading="lazy" rounded fluid /> : null}
            {renderBody(props.bodyTextSection.body)}
            {renderLinks(props.bodyTextSection.links)}
        </div>
    );
}

export interface IImageBodyTextProps {
    bodyTextSection: IBodyTextSection,
}

export default ImageBodyText;
