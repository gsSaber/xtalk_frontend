import type { ActionToFunctionMap } from "./types";
const sessionMap: ActionToFunctionMap = {
    "session_attached": async (data, websocket, conversation, outputAudioSession) => {
        const sid = data.session_id || null;
        conversation.state.sessionId = sid;
    },
    "session_info": async (data, websocket, conversation, outputAudioSession) => {
        const sid = data.session_id || null;
        console.log("[session_info] sessionId:", sid);
        conversation.state.sessionId = sid;
    },
};

export default sessionMap;
