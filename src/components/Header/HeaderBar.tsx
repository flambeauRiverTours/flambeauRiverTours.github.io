/**
 * Header bar for the site, containing links to external sites
 */

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import "./HeaderBar.scss"

function HeaderBar(){
  return (
    <Navbar expand="lg" className="headerBar bg-secondary shadow">
      <Container>
        <Navbar.Brand href="#home" className='justify-content-start me-auto'>Jack Treadwell</Navbar.Brand>
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