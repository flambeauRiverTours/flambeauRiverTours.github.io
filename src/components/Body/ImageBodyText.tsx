/**
 * Component to hold images and text within the body blocks of the page
 */

import { IBodyTextSection } from "../../datamodel/SectionData";
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';

function ImageBodyText(props: IImageBodyTextProps) {
  
    return (<>
        <Container fluid  style={{paddingTop: '3rem', textAlign: 'center'}}>
          <Image src={props.bodyTextSection.imagePath} style={{height: '20rem'}} rounded fluid />
        </Container>
        <Container fluid>
            <h4>{props.bodyTextSection.title}</h4>
            <p>{props.bodyTextSection.body}</p>
        </Container>
        </>
    );
}

export interface IImageBodyTextProps {
    bodyTextSection: IBodyTextSection,
    index: number;
}

export default ImageBodyText;