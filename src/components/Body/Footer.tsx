/**
 * Footer for the body block - fixed to the bottom of the block. Currently used to display copyright info.
 */

import Container from 'react-bootstrap/Container';
import './Footer.scss'

function Footer() {
  return (
    <Container fluid className="sticky bottom-0 footer">
      <small className='text-muted'>Copyright © 2024 Jack Treadwell</small>
    </Container>
  );
}

export default Footer;