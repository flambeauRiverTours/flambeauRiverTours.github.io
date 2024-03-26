import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';


function HeaderBar(){
  return (
    <Navbar expand="lg" className="bg-body-tertiary justify-content-between" data-bs-theme="dark" fixed="top">
      <Container>
        <Navbar.Brand href="#home">Jack Treadwell</Navbar.Brand>
        <Nav className="justify-content-end">
          <Nav.Link href='https://www.linkedin.com/in/john-treadwell/'>
            LinkedIn
          </Nav.Link>
          <Nav.Link href='https://github.com/flambeauRiverTours'>
            GitHub
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );

}

export default HeaderBar;