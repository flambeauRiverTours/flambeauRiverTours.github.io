/**
 * The "Ask about Jack's experience" drawer. Loaded lazily, the first time a visitor opens it, so the page doesn't pay for it.
 * The conversation lives only in memory: it survives closing the drawer, not a reload.
 */
import Offcanvas from "react-bootstrap/Offcanvas";
import Spinner from "react-bootstrap/Spinner";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { ask as askApi, warmUp as warmUpApi } from "./askAssistant";
import { conversationReducer, historyFor, maxQuestionLength, Turn, waitText } from "./conversation";
import "./AssistantDrawer.scss";

const starterQuestions = [
    "What is Jack working on at SPIE?",
    "What roles did Jack have at Epic?",
    "When could Jack start a new position?",
];
const counterFrom = 400; //characters typed before the counter appears
const slowAfterMs = 8_000;
const email = "jack.treadwell.dev@gmail.com";

function AssistantDrawer({ show, onHide, modal, ask = askApi, warmUp = warmUpApi }: IAssistantDrawerProps) {
    const [turns, dispatch] = useReducer(conversationReducer, []);
    const [draft, setDraft] = useState("");
    const [pendingId, setPendingId] = useState<string | null>(null);
    const request = useRef<AbortController | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const waiting = turns[turns.length - 1]?.state === "waiting";

    useEffect(() => {
        if (show) warmUp();
    }, [show, warmUp]);

    const send = async (question: string) => {
        const trimmed = question.trim();
        if (!trimmed || waiting) return;

        const history = historyFor(turns);
        dispatch({ type: "asked", question: trimmed });
        setDraft("");
        request.current = new AbortController();
        const result = await ask(trimmed, history, { signal: request.current.signal });
        dispatch({ type: "replied", result });
        //a question cancelled by closing the drawer waits in the box for the visitor's return
        if (result.kind === "cancelled") setDraft(trimmed);
    };

    const hide = () => {
        request.current?.abort();
        onHide();
    };

    //beside the page, follow the link at once; as a phone's modal, close first, since the drawer locks page scrolling
    const openLink = (id: string) => {
        if (modal) {
            setPendingId(id);
            hide();
        } else {
            window.location.hash = id;
        }
    };
    const afterClosed = () => {
        if (pendingId) {
            window.location.hash = pendingId;
            setPendingId(null);
        }
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        send(draft);
    };

    return (
        <Offcanvas
            show={show}
            onHide={hide}
            onEntered={() => input.current?.focus()}
            onExited={afterClosed}
            placement="end"
            backdrop={modal}
            scroll={!modal}
            className="assistantDrawer"
            aria-labelledby="assistantTitle"
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title id="assistantTitle">Ask about Jack's experience</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="assistantBody">
                <div className="conversation" aria-live="polite">
                    {turns.length === 0 ?
                        <div className="starters">
                            <p>Curious about Jack's work, skills or job search? Try one of these:</p>
                            {starterQuestions.map((question) =>
                                <button key={question} type="button" className="starter" onClick={() => send(question)}>{question}</button>)}
                        </div> :
                        turns.map((turn, index) =>
                            <div key={index} className="turn">
                                <p className="question">{turn.question}</p>
                                <Reply turn={turn} onLink={openLink} />
                            </div>)}
                </div>
                <form className="askForm" onSubmit={submit}>
                    <input
                        ref={input}
                        type="text"
                        aria-label="Your question"
                        placeholder="Type your question…"
                        value={draft}
                        maxLength={maxQuestionLength}
                        disabled={waiting}
                        onChange={(event) => setDraft(event.target.value)}
                    />
                    <button type="submit" className="send" disabled={waiting || !draft.trim()}>Send</button>
                    {draft.length >= counterFrom ? <small className="counter">{draft.length} / {maxQuestionLength}</small> : null}
                </form>
                {/* a div, not a footer: the page has the one contentinfo landmark */}
                <div className="notice">
                    <p>AI-generated from this site. It can be wrong, so check the resume.</p>
                    <p>Questions and answers are stored for 90 days to improve this assistant. Don't include personal information.</p>
                    <p><a href="/privacy.html">Privacy</a> · Prefer a human? <a href={`mailto:${email}`}>Email me</a>.</p>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
}

function Reply({ turn, onLink }: { turn: Turn; onLink: (id: string) => void }) {
    switch (turn.state) {
        case "waiting": return <Waiting />;
        case "answered": return <div className="answer">
            <p>{turn.answer}</p>
            {turn.links.map((link) =>
                <button key={link.id} type="button" className="answerLink" onClick={() => onLink(link.id)}>See: {link.label}</button>)}
        </div>;
        case "rateLimited": return <p className="answer problem">
            You've reached the question limit for now. Try again {waitText(turn.retryAfterSeconds)}, or <a href={`mailto:${email}`}>email Jack</a>.
        </p>;
        case "unavailable": return <p className="answer problem">
            The assistant is unavailable right now. You can <a href={`mailto:${email}`}>email Jack</a> or read <a href="/Jack-Treadwell-Resume.pdf">the resume</a>.
        </p>;
    }
}

//a cold start can take several seconds, so a long wait gets an explanation
function Waiting() {
    const [slow, setSlow] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setSlow(true), slowAfterMs);
        return () => clearTimeout(timer);
    }, []);

    //a div, not a p: the spinner is itself a div
    return <div className="answer waiting">
        <Spinner animation="border" size = "sm" role = "status" aria - hidden="true" /> { slow? "Still thinking…" : "Thinking…"}
    </div>;
}

interface IAssistantDrawerProps {
    show: boolean;
    onHide: () => void;
    modal: boolean; //true on phones, where the drawer covers the page; false beside the page on wide screens
    ask?: typeof askApi; //replaced in tests
    warmUp?: () => void; //replaced in tests
}

export default AssistantDrawer;
