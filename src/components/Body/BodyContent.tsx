/**
 * Shared rendering helpers for entry bodies and their link rows
 */

import { ILink } from "../../datamodel/SectionData";

//plain strings get wrapped in a paragraph, rich JSX bodies are rendered as-is
export function renderBody(body: string | JSX.Element){
  if (typeof body === "string"){
    return body ? <p>{body}</p> : null;
  }
  return body;
}

export function renderLinks(links?: ILink[]){
  if (!links?.length){
    return null;
  }
  return <p className="entryLinks">
    {links.map((link) => <a key={link.href} href={link.href}>{link.label} <span aria-hidden="true">↗</span></a>)}
  </p>;
}
