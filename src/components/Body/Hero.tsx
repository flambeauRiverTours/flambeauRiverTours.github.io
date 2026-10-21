/**
 * Hero header for the page
 */

import Image from 'react-bootstrap/Image';
import portraitImgUrl from '../../assets/1704245613526.jpg';
import LinkIconsItem from '../Sidebar/LinkIconsItem';
import { IHighlight, IProfile } from '../../datamodel/SectionData';

function Hero(props: IHeroProps) {
    return (
        <header className="hero">
            <Image src={portraitImgUrl} alt={"Portrait of " + props.profile.name} className="heroPortrait" roundedCircle />
            <h1>{props.profile.name}</h1>
            <p className="heroRole">{props.profile.role}</p>
            <p className="heroLocation">{props.profile.location}</p>
            <LinkIconsItem showLabels variant="onLight" />
            <ul className="highlights">
                {props.highlights.map((highlight) =>
                    <li key={highlight.value}>
                        <span className="highlightValue">{highlight.value}</span>
                        <span className="highlightLabel">{highlight.label}</span>
                    </li>
                )}
            </ul>
        </header>
    );
}

interface IHeroProps {
    profile: IProfile;
    highlights: IHighlight[];
}

export default Hero;
