/**
 * Factory class that creates JSX elements for rich-text body blocks within the webpage
 */

export abstract class RichBodyTextSectionFactory{
    public static getBodyTextJSX(richBodyTextSection: RichBodyTextSections): JSX.Element{
        switch(richBodyTextSection){
            case RichBodyTextSections.ProjectsTitle:
                return <p>
                    Below are some of the projects I work on in my free time - they're generally listed out in reverse chronological order. You can find most of them on my <a href="https://github.com/flambeauRiverTours">GitHub</a>.
                </p>;
            case RichBodyTextSections.ProjectsWebpage:
                return <p>I used the development of this site to catch up on many of the additions to the modern web development experience I didn’t get to utilize at Epic. This site is implemented in React, primarily using <a href="https://react-bootstrap.github.io/">React Bootstrap</a> for the components of the site. I used <a href="https://vitejs.dev/">Vite</a> for local development server setup, and hosted the site using GitHub pages, using GitHub actions to deploy the site after commits from my local machine.</p>;
            case RichBodyTextSections.AmericanFootballManager:
                return <p>I've always been a fan of both high-level management games, as well as sports game. <a href="https://www.footballmanager.com/">The Football Manager series</a>, in particular, has been one of my most-played set of games. However, I've always wanted a version of Football Manager for Amercian Football, and I've found existing options for this pretty underwhelming. Recently I stumbled upon <a href="https://dotnet.microsoft.com/en-us/apps/maui">.NET MAUI</a>, and wanted a project to test this out. So, I've started work on American Football Manager, which I intend to be a lightweight clone of Football Manager for American football that's implemented with .NET MAUI.</p>;
        }
    }
}

export enum RichBodyTextSections{
    ProjectsTitle,
    ProjectsWebpage,
    AmericanFootballManager,
}

export default RichBodyTextSectionFactory;