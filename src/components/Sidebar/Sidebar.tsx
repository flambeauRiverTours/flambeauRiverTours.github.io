/**
 * Sidebar for the site. Buttons update the content in the body of the site
 */
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import { useState } from "react";
import "./Siderbar.scss"
import LinkIconsItem from "./LinkIconsItem";

function Sidebar(props: ISideBarInitializationProps){
    const [activeIndex, setActiveIndex] = useState(props.activeIndex);
    return (
        <Container fluid className="sticky top-0 bg-secondary sidebar" >
            <Stack gap={3} className="sticky top-0 flex flex-col " >
                {props.hideName ? null :
                <Container className="text-light font-weight-bold text-lg-center nameItem" fluid>
                    Jack Treadwell
                </Container>}
                <LinkIconsItem/>
                <div className="dividerBar"/>
                {props.buttonTitles.map((buttonTitle: string, index: number) =>{
                    const buttonClick = () => {
                        if (index === activeIndex) {return;}
                        props.buttonSelectionCallback(index); //tells App.tsx to change the active body block
                        setActiveIndex(index);
                    }
                    return <Button id={"Sidebar Button " + index} active={activeIndex === index} onClick={buttonClick} variant="secondary">{buttonTitle}</Button>
                })}
            </Stack>
        </Container>);
}

interface ISideBarInitializationProps{
    buttonTitles: string[]; //List of button titles to show in the sidebar
    buttonSelectionCallback: (index: number) => void; //Callback to invoke when a button is selected
    hideName?: boolean;
    activeIndex: number;
}

export default Sidebar;