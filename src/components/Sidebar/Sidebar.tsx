/**
 * Sidebar for the site, with links that jump to the matching section of the page via #anchors
 */
import Stack from "react-bootstrap/Stack";
import React from "react";
import "./Siderbar.scss"
import LinkIconsItem from "./LinkIconsItem";
import { ISectionData, SectionGroup } from "../../datamodel/SectionData";

function Sidebar(props: ISideBarInitializationProps) {
    return (
        <nav className="sidebar" aria-label="Site sections">
            <Stack gap={3}>
                {props.hideName ? null :
                    <div className="nameItem">
                        <div className="name">Jack Treadwell</div>
                        <div className="role">Senior Software Engineer</div>
                    </div>}
                <LinkIconsItem />
                <div className="dividerBar" />
                <Stack gap={1}>
                    {props.sections.map((section: ISectionData, index: number) => {
                        //label the start of the personal sections so they read as secondary to the professional ones
                        const startsPersonalGroup = section.group === SectionGroup.personal && props.sections[index - 1]?.group !== SectionGroup.personal;
                        return <React.Fragment key={section.id}>
                            {startsPersonalGroup ? <div className="navGroupLabel">Beyond work</div> : null}
                            <a
                                href={"#" + section.id}
                                className={"navButton" + (props.activeId === section.id ? " active" : "")}
                                aria-current={props.activeId === section.id ? "location" : undefined}
                                onClick={props.onNavigate ? (event) => props.onNavigate!(section.id, event) : undefined}
                            >{section.buttonTitle}</a>
                        </React.Fragment>
                    })}
                </Stack>
            </Stack>
        </nav>);
}

interface ISideBarInitializationProps {
    sections: ISectionData[]; //Sections of the page to link to
    activeId: string; //id of the section currently in view
    hideName?: boolean;
    onNavigate?: (id: string, event: React.MouseEvent) => void; //Optional hook to intercept link clicks (e.g. to close the mobile menu first)
}

export default Sidebar;
