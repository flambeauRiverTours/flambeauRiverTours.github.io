/**
 * Container to hold main content in the page
 */

import Image from 'react-bootstrap/Image'
import Stack from 'react-bootstrap/Stack'
import Container from 'react-bootstrap/Container'
import Fade from 'react-bootstrap/Fade'
import { BodyBlockStyle, IBodyTextSection, ISectionData } from "../../datamodel/SectionData";

function BodyBlock(props: IBodyBlockProps){
    return (
    <Fade in={props.visible} mountOnEnter unmountOnExit onExited={props.afterFadeOut}>
      <Stack gap={3} className="justify-content-md-center bg-body"  >
        <Container fluid  style={{paddingTop: '3rem', textAlign: 'center'}}>
          <Image src={props.sectionData.imagePath} style={{height: '20rem'}} roundedCircle fluid />
        </Container>
        <Container fluid>
          {props.sectionData.bodyTextSections.map((value: IBodyTextSection, index: number) =>{
            const elementId = "Body Block " + index; 
            switch (value.style){
              case BodyBlockStyle.titleBlock:
                return <div id={elementId}>
                  <h1>{value.title}</h1>
                  {value.body}
                </div>
              case BodyBlockStyle.contentBlock:
                return <div id={elementId}>
                  <h4>{value.title}</h4>
                  {value.body}
                </div>;
              case BodyBlockStyle.imageBlock:
                return <div id={elementId}>
                  <h1>{value.title}</h1>
                  {value.body}
                </div>
            }})}
        </Container>
      </Stack>
    </Fade>);
}

interface IBodyBlockProps{
  sectionData: ISectionData;
  visible: boolean;
  afterFadeOut?: () => void;
}

export default BodyBlock;