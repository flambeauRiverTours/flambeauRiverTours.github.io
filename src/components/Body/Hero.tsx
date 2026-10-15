/**
 * Hero header for the page
 */

import Image from 'react-bootstrap/Image';
import portraitImgUrl from '../../assets/1704245613526.jpg';
import LinkIconsItem from '../Sidebar/LinkIconsItem';
import { IHighlight } from '../../datamodel/SectionData';

function Hero(props: IHeroProps) {
    return (
        <header className="hero">
            <Image src={portraitImgUrl} alt="Portrait of Jack Treadwell" className="heroPortrait" roundedCircle />
            <h1>Jack Treadwell</h1>
            <p className="heroRole">Senior Software Engineer · .NET, Azure &amp; React</p>
            <p className="heroLocation">Berlin, Germany · Relocating to Charlotte, NC in January 2027</p>
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
    highlights: IHighlight[];
}

export default Hero;
