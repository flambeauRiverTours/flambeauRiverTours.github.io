/**
 * Container holding feature cards that link out to subpages
 */
import FeatureCard from "./FeatureCard";
import "bootstrap/dist/css/bootstrap.css"
function CardContainer(){
    return (
    <div className="container px-4 py-5" id="custom-cards">
    <div className="row row-cols-1 row-cols-lg-3 align-items-stretch g-4 py-5">
        <FeatureCard title="About me" link="#"/>
        <FeatureCard title="Projects I'm working on" />
        <FeatureCard title="Things I'm reading" />
    </div>
    </div>)
}

export default CardContainer;