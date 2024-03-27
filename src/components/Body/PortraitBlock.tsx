/**
 * Container holding the portrait as well as the cards.
 */

import CardContainer from "./CardContainer";
import Image from 'react-bootstrap/Image'
import Stack from 'react-bootstrap/Stack'
import Container from 'react-bootstrap/Container'
function PortraitBlock(){
    return <>
    <Stack gap={3} className="justify-content-md-center bg-body"  >
      <Container fluid  style={{paddingTop: '3rem', textAlign: 'center'}}>
        <Image src="src\assets\1704245613526.jpg" style={{height: '30rem'}} roundedCircle fluid />
      </Container>
      <Container fluid>
        <CardContainer />
      </Container>
    </Stack>
    </>;

}

export default PortraitBlock;