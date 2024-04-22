/**
 * Header bar that replaces the sidebar when the screen is too small to show both the sidebar and the body blocks
 * @param props The initialization props for the header bar
* @returns The header bar component
 */
import Navbar from "react-bootstrap/Navbar";
import Offcanvas from "react-bootstrap/Offcanvas"; 
import Container from "react-bootstrap/Container";
import Sidebar from "../Sidebar/Sidebar";
import { useState } from "react";
import "./HeadBar.scss";

function HeaderBar(props: IHeaderInitializationProps) {
    const [showOffcanvas, setShowOffCanvas] = useState(false);
    const handleClose = () => setShowOffCanvas(false);
    const handleShow = () => setShowOffCanvas(true);
    const wrappedButtonSelectionCallback = (index: number) => {
        handleClose();
        props.buttonSelectionCallback(index);
    };
    return (
        <>
          {[false].map((expand) => (
            <Navbar expand={expand} fixed="top" className="bg-transparent">
              <Container fluid>
              <Navbar.Brand ></Navbar.Brand>
                <Navbar.Toggle className="justify-content-end" onClick={handleShow} />
                <Navbar.Offcanvas
                  id={`offcanvasNavbar-expand-${expand}`}
                  aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                  placement="end"
                  className="bg-secondary"
                  show={showOffcanvas}
                  onHide={handleClose}
                >
                  <Offcanvas.Header closeButton closeVariant="white" className="text-light text-lg-center">
                    <Container fluid>
                      <Offcanvas.Title className="nameTitle" id={`offcanvasNavbarLabel-expand-${expand}`}>
                        Jack Treadwell
                      </Offcanvas.Title>
                    </Container>
                  </Offcanvas.Header>
                  <Offcanvas.Body>
                    <Sidebar activeIndex={props.activeIndex} hideName buttonTitles={props.buttonTitles} buttonSelectionCallback={wrappedButtonSelectionCallback}/>
                  </Offcanvas.Body>
                </Navbar.Offcanvas>
              </Container>
            </Navbar>
          ))}
        </>
      );
}

interface IHeaderInitializationProps{
    buttonTitles: string[]; //List of button titles to show in the sidebar
    buttonSelectionCallback: (index: number) => void; //Callback to invoke when a button is selected
    activeIndex: number;
}

export default HeaderBar;