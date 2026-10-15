/**
 * Header bar that replaces the sidebar when the screen is too small to show both the sidebar and the body.
 * Keeps my name and role visible, with the section links in a slide-out menu.
 */
import Navbar from "react-bootstrap/Navbar";
import Offcanvas from "react-bootstrap/Offcanvas";
import Container from "react-bootstrap/Container";
import Sidebar from "../Sidebar/Sidebar";
import React, { useState } from "react";
import { ISectionData } from "../../datamodel/SectionData";
import "./HeadBar.scss";

function HeaderBar(props: IHeaderInitializationProps) {
    const [showOffcanvas, setShowOffCanvas] = useState(false);
    const [pendingId, setPendingId] = useState<string | null>(null);

    //the menu locks page scrolling while open, so close it first and only jump to the section once it has closed
    const navigate = (id: string, event: React.MouseEvent) => {
        event.preventDefault();
        setPendingId(id);
        setShowOffCanvas(false);
    };
    const afterMenuClosed = () => {
        if (pendingId) {
            window.location.hash = pendingId;
            setPendingId(null);
        }
    };

    return (
        <Navbar expand={false} fixed="top" className="headerBar">
            <Container fluid>
                <Navbar.Brand href="#about" className="headerBrand">
                    <span className="name">Jack Treadwell</span>
                    <span className="role">Senior Software Engineer</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="sectionMenu" label="Open section menu" onClick={() => setShowOffCanvas(true)} />
                <Offcanvas
                    id="sectionMenu"
                    aria-labelledby="sectionMenuLabel"
                    placement="end"
                    className="bg-secondary"
                    show={showOffcanvas}
                    onHide={() => setShowOffCanvas(false)}
                    onExited={afterMenuClosed}
                >
                    <Offcanvas.Header closeButton closeVariant="white" className="text-light">
                        <Offcanvas.Title id="sectionMenuLabel">Jack Treadwell</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        <Sidebar sections={props.sections} activeId={props.activeId} hideName onNavigate={navigate}/>
                    </Offcanvas.Body>
                </Offcanvas>
            </Container>
        </Navbar>
      );
}

interface IHeaderInitializationProps{
    sections: ISectionData[]; //Sections of the page to link to
    activeId: string; //id of the section currently in view
}

export default HeaderBar;
