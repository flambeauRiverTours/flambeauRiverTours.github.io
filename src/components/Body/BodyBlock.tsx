/**
 * Container to hold main content in the page
 */

import Image from 'react-bootstrap/Image'
import Stack from 'react-bootstrap/Stack'
import Container from 'react-bootstrap/Container'
import Collapse from 'react-bootstrap/Collapse'
import { IBodyTextSection, ISectionData } from "../../datamodel/SectionData";

function BodyBlock(props: IBodyBlockProps){
    return <>
    <Collapse in={props.visible}>
    <Stack  gap={3} className="justify-content-md-center bg-body"  >
      <Container fluid  style={{paddingTop: '3rem', textAlign: 'center'}}>
        <Image src={props.sectionData.imagePath} style={{height: '30rem'}} roundedCircle fluid />
      </Container>
      <Container fluid>
        {props.sectionData.bodyTextSections.map((value: IBodyTextSection) =>{
          return <>
            <h1>{value.title}</h1>
            <p>{value.body}</p>
          </> })}
      </Container>
    </Stack>
    </Collapse>
    </>;

}

interface IBodyBlockProps{
  sectionData: ISectionData;
  visible: boolean;
}

export default BodyBlock;