import CardContainer from "./CardContainer";


function PortraitBlock(){
    return <>
    <section className="py-5 text-center container" data-bs-theme="dark">
    <div className="row py-lg-5">
      <div className="col-lg-6 col-md-8 mx-auto">
        <img  src="https://media.licdn.com/dms/image/D4E03AQGro4fYHxGiqw/profile-displayphoto-shrink_400_400/0/1704245613526?e=1717027200&v=beta&t=8UH09ZAA9M8iZ_ycN0B_IENCBB0Wr88xQimk6jRasBI" className="bd-placeholder-img rounded-circle" height="250" width="250"/>
        <div className="d-flex gap-2 justify-content-center py-5">
        <CardContainer />
        </div>
      </div>
    </div>
  </section>
    </>;

}

export default PortraitBlock;