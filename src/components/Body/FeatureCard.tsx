
/**
 * Large feature card placed in the middle of the site. Links out to another portion of the site,
 * can contain a background image.
 * 
 */
import "bootstrap/dist/css/bootstrap.css"
function FeatureCard(props: any){
    const backgroundImageStyle = {backgroundImage: "url(" + props.image + ")"};
    return (<div className="col"><a href="#">
    <div className="card card-cover h-100 overflow-hidden text-bg-dark rounded-4 shadow-lg" style={backgroundImageStyle}>
      <div className="d-flex flex-column h-100 p-5 pb-3 text-white text-shadow-1">
        <h3 className="pt-5 mt-5 mb-4 display-6 lh-1 fw-bold">{props.title}</h3>
      </div>
    </div>
    </a>
  </div>);
}

export default FeatureCard;