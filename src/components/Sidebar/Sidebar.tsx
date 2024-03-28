/**
 * Sidebar for the site. Buttons update the content in the body of the site
 */
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { useState } from "react";
import "./Siderbar.scss"

function Sidebar(props: ISideBarInitializationProps){
    const [activeIndex, setActiveIndex] = useState(0);
    return (
        <Container fluid className="sticky top-0 bg-secondary sidebar" >
    <Stack gap={3} className="sticky top-0 flex flex-col " >
        <br/>
        {props.buttonTitles.map((buttonTitle: string, index: number) =>{
            const buttonClick = () => {
                if (index === activeIndex) {return;}
                props.buttonSelectionCallback(index);
                setActiveIndex(index);
            }
           return <Button active={activeIndex === index} onClick={buttonClick} variant="secondary" className="sidebar-button">{buttonTitle}</Button>
        })}
    </Stack>
    </Container>);
}

interface ISideBarInitializationProps{
    buttonTitles: string[];
    buttonSelectionCallback: (index: number) => void;
}

export default Sidebar;