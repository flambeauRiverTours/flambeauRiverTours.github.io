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
            case RichBodyTextSections.TidbytBerlinTransit:
                return <p>I've had a <a href="https://tidbyt.com/">Tidbyt</a> for a number of years, and as a user of public transit in Berlin, I wanted to be able to see upcoming train departures on my Tibyt. So, I created an app that displays that gets train timing and departure data from the VBB trainsit authority and displays this info in a user-friendly way. You can check out the pull request <a href="https://github.com/tidbyt/community/pull/2518">here</a>. This development was a great opporunity to contribute to an open source project, as well as good practice for working with RESTful APIs.</p>;
        }
    }
}

export enum RichBodyTextSections{
    ProjectsTitle,
    ProjectsWebpage,
    TidbytBerlinTransit,
}

export default RichBodyTextSectionFactory;