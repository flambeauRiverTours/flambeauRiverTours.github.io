/**
 * One section of the page (About, Experience, etc.), anchored by its id so it can be linked to with #id
 */

import { BodyBlockStyle, IBodyTextSection, ISectionData } from "../../datamodel/SectionData";
import ImageBodyText from './ImageBodyText';
import { renderBody, renderLinks } from './BodyContent';

function BodyBlock(props: IBodyBlockProps){
    return (
      <section id={props.sectionData.id} className="pageSection" aria-labelledby={props.sectionData.id + "-title"}>
        {props.sectionData.bodyTextSections.map((value: IBodyTextSection, index: number) =>{
          const key = props.sectionData.id + index;
          switch (value.style){
            case BodyBlockStyle.titleBlock:
              return <div key={key}>
                <h2 id={props.sectionData.id + "-title"} className="sectionTitle">{value.title}</h2>
                {renderBody(value.body)}
              </div>
            case BodyBlockStyle.contentBlock:
              return <div key={key} id={value.id} className={value.title ? "entry" : undefined}>
                {value.title ? <h3>{value.title}</h3> : null}
                {value.subtitle ? <p className="entryMeta">{value.subtitle}</p> : null}
                {renderBody(value.body)}
                {renderLinks(value.links)}
              </div>;
            case BodyBlockStyle.imageBlock:
              return <ImageBodyText key={key} bodyTextSection={value} />;
          }})}
      </section>);
}

interface IBodyBlockProps{
  sectionData: ISectionData;
}

export default BodyBlock;
