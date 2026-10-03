import "./VideoMeet.css";

import { useRef, useState, useEffect } from "react";
import server from "../environment.js";

import {
    Box,
    Typography,
    IconButton,
    Paper,
    Tooltip,
    Badge
} from "@mui/material";

import {
    Mic,
    MicOff,
    Videocam,
    VideocamOff,
    ScreenShare,
    StopScreenShare,
    Chat,
    People,
    CallEnd,
    MoreVert
} from "@mui/icons-material";

import { io } from "socket.io-client";

const server_url = server;
console.log("Server url",server_url);

// socketId -> RTCPeerConnection
var connections = {};
// socketId -> ICE candidates that arrived before the remote description
var pendingCandidates = {};

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

/*
------------------------------------------------
Remote video tile. Sets srcObject only when the
stream actually changes (avoids flicker/restarts).
------------------------------------------------
*/
function RemoteVideo({ stream }) {
    const ref = useRef();

    useEffect(() => {
        if (ref.current && ref.current.srcObject !== stream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={ref}
            autoPlay
            playsInline
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
            }}
        />
    );
}

function VideoMeetComponent() {

    const socketRef = useRef();
    const socketIdRef = useRef();

    const localVideoRef = useRef(null);
    const screenStreamRef = useRef(null);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);

    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);

    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const [videos, setVideos] = useState([]);

    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    /*
    ------------------------------------------------
    LOCAL VIDEO REF (FIX #1)
    Lobby and meeting screens render different <video>
    elements. A callback ref re-attaches the stream
    every time one of them mounts.
    ------------------------------------------------
    */

    const setLocalVideo = (el) => {
        localVideoRef.current = el;

        if (el) {
            const stream = screenStreamRef.current || window.localStream;
            if (stream && el.srcObject !== stream) {
                el.srcObject = stream;
            }
        }
    };

    /*
    ------------------------------------------------
    PERMISSIONS
    ------------------------------------------------
    */

const getPermissions = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        console.log("Camera and microphone permission granted");

        window.localStream = stream;

        setVideoAvailable(true);
        setAudioAvailable(true);

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        }

    } catch (err) {
        console.error("Error accessing camera/microphone:", err);

        if (err.name === "NotAllowedError") {
            console.log("Camera/microphone permission was denied");
        }

        if (err.name === "NotFoundError") {
            console.log("Camera or microphone not found");
        }
    }
};
    useEffect(() => {

        getPermissions();

        // Cleanup when the component unmounts
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            Object.values(connections).forEach((pc) => pc.close());
            connections = {};
            pendingCandidates = {};

            if (window.localStream) {
                window.localStream.getTracks().forEach((t) => t.stop());
            }
        };

    }, []);

    /*
    ------------------------------------------------
    TOGGLE MICROPHONE / CAMERA
    ------------------------------------------------
    */

    const toggleAudio = () => {

        if (!window.localStream) return;

        const audioTracks = window.localStream.getAudioTracks();

        audioTracks.forEach((track) => {
            track.enabled = !track.enabled;
        });

        setAudio(audioTracks.length > 0 ? audioTracks[0].enabled : false);
    };

    const toggleVideo = () => {

        if (!window.localStream) return;

        const videoTracks = window.localStream.getVideoTracks();

        videoTracks.forEach((track) => {
            track.enabled = !track.enabled;
        });

        setVideo(videoTracks.length > 0 ? videoTracks[0].enabled : false);
    };

    /*
    ------------------------------------------------
    SCREEN SHARE (now sent to remote peers too)
    ------------------------------------------------
    */

    const replaceVideoTrackForPeers = (track) => {
        Object.values(connections).forEach((pc) => {
            const sender = pc
                .getSenders()
                .find((s) => s.track && s.track.kind === "video");

            if (sender) {
                sender.replaceTrack(track).catch(console.log);
            }
        });
    };

    const stopScreenShare = () => {

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
        }

        const cameraTrack = window.localStream?.getVideoTracks()[0];

        if (cameraTrack) {
            replaceVideoTrackForPeers(cameraTrack);
        }

        if (localVideoRef.current && window.localStream) {
            localVideoRef.current.srcObject = window.localStream;
        }

        setScreen(false);
    };

    const toggleScreenShare = async () => {

        try {

            if (!screen) {

                const screenStream =
                    await navigator.mediaDevices.getDisplayMedia({
                        video: true
                    });

                screenStreamRef.current = screenStream;

                const screenTrack = screenStream.getVideoTracks()[0];

                replaceVideoTrackForPeers(screenTrack);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                // Fires when user clicks the browser's "Stop sharing"
                screenTrack.onended = stopScreenShare;

                setScreen(true);

            } else {

                stopScreenShare();
            }

        } catch (error) {

            console.log("Screen share error:", error);
        }
    };

    /*
    ------------------------------------------------
    LEAVE MEETING
    ------------------------------------------------
    */

    const leaveMeeting = () => {

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        Object.values(connections).forEach((pc) => pc.close());
        connections = {};
        pendingCandidates = {};

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        if (window.localStream) {
            window.localStream.getTracks().forEach((track) => track.stop());
        }

        window.location.href = "/landing";
    };

    /*
    ------------------------------------------------
    CHAT
    ------------------------------------------------
    */

    const addMessage = (data, sender) => {
        setMessages((prev) => [...prev, { sender, data }]);
    };

    const sendMessage = () => {

        if (!message.trim()) return;

        socketRef.current?.emit("chat-message", message, username);

        setMessage("");
    };

    /*
    ------------------------------------------------
    WEBRTC SIGNALING (FIX #2)
    ------------------------------------------------
    */

    const flushPendingCandidates = (peerId) => {
        const pc = connections[peerId];
        const list = pendingCandidates[peerId] || [];

        list.forEach((c) => {
            pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.log);
        });

        pendingCandidates[peerId] = [];
    };

    const gotMessageFromServer = (fromId, message) => {

        const signal = JSON.parse(message);

        if (fromId === socketIdRef.current) return;

        const pc = connections[fromId];
        if (!pc) return;

        if (signal.sdp) {

            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {

                    flushPendingCandidates(fromId);

                    if (signal.sdp.type === "offer") {
                        return pc
                            .createAnswer()
                            .then((desc) => pc.setLocalDescription(desc))
                            .then(() => {
                                socketRef.current.emit(
                                    "signal",
                                    fromId,
                                    JSON.stringify({ sdp: pc.localDescription })
                                );
                            });
                    }
                })
                .catch(console.log);
        }

        if (signal.ice) {

            if (pc.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(signal.ice))
                    .catch(console.log);
            } else {
                // Remote description not set yet: hold the candidate
                pendingCandidates[fromId] = [
                    ...(pendingCandidates[fromId] || []),
                    signal.ice
                ];
            }
        }
    };

    const createPeerConnection = (peerId) => {

        const pc = new RTCPeerConnection(peerConfigConnections);
        connections[peerId] = pc;
        pendingCandidates[peerId] = [];

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit(
                    "signal",
                    peerId,
                    JSON.stringify({ ice: event.candidate })
                );
            }
        };

        pc.ontrack = (event) => {

            const stream = event.streams[0];

            setVideos((prev) =>
                prev.some((v) => v.socketId === peerId)
                    ? prev.map((v) =>
                        v.socketId === peerId ? { ...v, stream } : v
                    )
                    : [...prev, { socketId: peerId, stream }]
            );
        };

        // Send our camera + mic to this peer
        if (window.localStream) {
            window.localStream
                .getTracks()
                .forEach((track) => pc.addTrack(track, window.localStream));
        }

        // If we're already screen sharing, send the screen instead of the camera
        const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
        if (screenTrack) {
            const sender = pc
                .getSenders()
                .find((s) => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(screenTrack).catch(console.log);
        }

        return pc;
    };

    const connectToSocketServer = () => {

        // Avoid opening a second socket
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        socketRef.current = io(server_url);

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("connect", () => {

            console.log("Socket connected:", socketRef.current.id);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.emit("join-call", window.location.href);
        });

        socketRef.current.on("chat-message", addMessage);

        socketRef.current.on("user-left", (id) => {

            console.log("USER LEFT:", id);

            setVideos((prev) => prev.filter((v) => v.socketId !== id));

            if (connections[id]) {
                connections[id].close();
                delete connections[id];
                delete pendingCandidates[id];
            }
        });

        // Server sends: (idOfWhoJoined, listOfAllClientIds)
        socketRef.current.on("user-joined", (id, clients) => {

            clients.forEach((peerId) => {
                if (peerId === socketIdRef.current) return;
                if (connections[peerId]) return;

                createPeerConnection(peerId);
            });

            // Only the user who just joined creates the offers
            if (id === socketIdRef.current) {

                Object.keys(connections).forEach((peerId) => {

                    const pc = connections[peerId];

                    pc.createOffer()
                        .then((desc) => pc.setLocalDescription(desc))
                        .then(() => {
                            socketRef.current.emit(
                                "signal",
                                peerId,
                                JSON.stringify({ sdp: pc.localDescription })
                            );
                        })
                        .catch(console.log);
                });
            }
        });
    };

    /*
    ------------------------------------------------
    CONNECT
    ------------------------------------------------
    */

    const connect = () => {

        if (!username.trim()) {
            alert("Please enter username");
            return;
        }

        setAskForUsername(false);

        setVideo(videoAvailable);
        setAudio(audioAvailable);

        connectToSocketServer();
    };

    /*
    ==================================================
    LOBBY
    ==================================================
    */

    if (askForUsername) {

        return (

            <Box
                sx={{
                    minHeight: "100vh",
                    background: "#111111",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 2
                }}
            >

                <Paper
                    elevation={10}
                    sx={{
                        width: 420,
                        padding: 4,
                        background: "#1f1f1f",
                        color: "white",
                        borderRadius: 3
                    }}
                >

                    <Typography
                        variant="h5"
                        sx={{ textAlign: "center", mb: 3 }}
                    >
                        Join Meeting
                    </Typography>

                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") connect();
                        }}
                        placeholder="Enter your name"
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "8px",
                            border: "1px solid #555",
                            background: "#2b2b2b",
                            color: "white",
                            fontSize: "16px",
                            boxSizing: "border-box"
                        }}
                    />

                    <button
                        onClick={connect}
                        style={{
                            width: "100%",
                            marginTop: "20px",
                            padding: "13px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#1976d2",
                            color: "white",
                            fontSize: "16px",
                            cursor: "pointer"
                        }}
                    >
                        Join Meeting
                    </button>

                    <Box sx={{ mt: 3 }}>

                        <video
                            ref={setLocalVideo}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width: "100%",
                                borderRadius: "12px"
                            }}
                        />

                    </Box>

                </Paper>

            </Box>
        );
    }

    /*
    ==================================================
    MEETING UI
    ==================================================
    */

    return (

        <Box
            sx={{
                height: "100vh",
                width: "100%",
                background: "#0b0b0f",
                color: "white",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}
        >

            {/* TOP BAR */}

            <Box
                sx={{
                    height: "64px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",
                    background: "#15151c",
                    borderBottom: "1px solid #292929"
                }}
            >

                <Box>

                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        VideoMeet
                    </Typography>

                    <Typography variant="caption" sx={{ color: "#aaa" }}>
                        Room: {window.location.pathname}
                    </Typography>

                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

                    <Tooltip title="Participants">

                        <IconButton
                            onClick={() => setShowParticipants(!showParticipants)}
                            sx={{ color: "white" }}
                        >
                            <Badge badgeContent={videos.length + 1} color="primary">
                                <People />
                            </Badge>
                        </IconButton>

                    </Tooltip>

                    <Tooltip title="More">

                        <IconButton sx={{ color: "white" }}>
                            <MoreVert />
                        </IconButton>

                    </Tooltip>

                </Box>

            </Box>

            {/* MAIN MEETING AREA */}

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    position: "relative",
                    padding: 2,
                    overflow: "auto"
                }}
            >

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${videos.length + 1 >= 3 ? 2 : 1
                            }, minmax(0, 1fr))`,
                        gap: 2,
                        alignContent: "center"
                    }}
                >

                    {/* LOCAL VIDEO */}

                    <Box
                        sx={{
                            position: "relative",
                            background: "#1c1c24",
                            borderRadius: 3,
                            overflow: "hidden",
                            height: "45vh",
                            minHeight: "250px"
                        }}
                    >

                        <video
                            ref={setLocalVideo}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                            }}
                        />

                        <Box
                            sx={{
                                position: "absolute",
                                bottom: 12,
                                left: 12,
                                background: "rgba(0,0,0,0.65)",
                                padding: "6px 12px",
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="body2">
                                You ({username})
                            </Typography>
                        </Box>

                    </Box>

                    {/* REMOTE VIDEOS */}

                    {videos.map((v) => (

                        <Box
                            key={v.socketId}
                            sx={{
                                position: "relative",
                                background: "#1c1c24",
                                borderRadius: 3,
                                overflow: "hidden",
                                height: "45vh",
                                minHeight: "250px"
                            }}
                        >

                            <RemoteVideo stream={v.stream} />

                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 12,
                                    left: 12,
                                    background: "rgba(0,0,0,0.65)",
                                    padding: "6px 12px",
                                    borderRadius: 2
                                }}
                            >
                                <Typography variant="body2">
                                    Participant
                                </Typography>
                            </Box>

                        </Box>

                    ))}

                </Box>

                {/* CHAT PANEL */}

                {showChat && (

                    <Paper
                        sx={{
                            position: "absolute",
                            right: 20,
                            top: 20,
                            bottom: 20,
                            width: 330,
                            background: "#1b1b22",
                            color: "white",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: 3,
                            zIndex: 10
                        }}
                    >

                        <Box sx={{ padding: 2, borderBottom: "1px solid #333" }}>
                            <Typography variant="h6">Chat</Typography>
                        </Box>

                        <Box sx={{ flex: 1, padding: 2, overflowY: "auto" }}>

                            {messages.map((msg, index) => (

                                <Box key={index} sx={{ mb: 2 }}>

                                    <Typography
                                        variant="caption"
                                        sx={{ color: "#aaa" }}
                                    >
                                        {msg.sender}
                                    </Typography>

                                    <Typography>{msg.data}</Typography>

                                </Box>

                            ))}

                        </Box>

                        <Box sx={{ display: "flex", padding: 1, gap: 1 }}>

                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") sendMessage();
                                }}
                                placeholder="Send message..."
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    background: "#2a2a32",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px"
                                }}
                            />

                        </Box>

                    </Paper>

                )}

            </Box>

            {/* BOTTOM CONTROL BAR */}

            <Box
                sx={{
                    height: "90px",
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1.5,
                    background: "#111118"
                }}
            >

                {/* MICROPHONE */}

                <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>

                    <IconButton
                        onClick={toggleAudio}
                        sx={{
                            width: 52,
                            height: 52,
                            background: audio ? "#2b2b35" : "#d32f2f",
                            color: "white",
                            "&:hover": {
                                background: audio ? "#3a3a45" : "#b71c1c"
                            }
                        }}
                    >
                        {audio ? <Mic /> : <MicOff />}
                    </IconButton>

                </Tooltip>

                {/* CAMERA */}

                <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>

                    <IconButton
                        onClick={toggleVideo}
                        sx={{
                            width: 52,
                            height: 52,
                            background: video ? "#2b2b35" : "#d32f2f",
                            color: "white",
                            "&:hover": {
                                background: video ? "#3a3a45" : "#b71c1c"
                            }
                        }}
                    >
                        {video ? <Videocam /> : <VideocamOff />}
                    </IconButton>

                </Tooltip>

                {/* SCREEN SHARE */}

                {screenAvailable && (

                    <Tooltip title={screen ? "Stop sharing" : "Share screen"}>

                        <IconButton
                            onClick={toggleScreenShare}
                            sx={{
                                width: 52,
                                height: 52,
                                background: "#2b2b35",
                                color: "white",
                                "&:hover": { background: "#3a3a45" }
                            }}
                        >
                            {screen ? <StopScreenShare /> : <ScreenShare />}
                        </IconButton>

                    </Tooltip>

                )}

                {/* CHAT */}

                <Tooltip title="Chat">

                    <IconButton
                        onClick={() => setShowChat(!showChat)}
                        sx={{
                            width: 52,
                            height: 52,
                            background: "#2b2b35",
                            color: "white",
                            "&:hover": { background: "#3a3a45" }
                        }}
                    >
                        <Chat />
                    </IconButton>

                </Tooltip>

                {/* PARTICIPANTS */}

                <Tooltip title="Participants">

                    <IconButton
                        onClick={() => setShowParticipants(!showParticipants)}
                        sx={{
                            width: 52,
                            height: 52,
                            background: "#2b2b35",
                            color: "white"
                        }}
                    >
                        <People />
                    </IconButton>

                </Tooltip>

                {/* LEAVE */}

                <Tooltip title="Leave meeting">

                    <IconButton
                        onClick={leaveMeeting}
                        sx={{
                            width: 60,
                            height: 52,
                            marginLeft: 2,
                            background: "#d32f2f",
                            color: "white",
                            borderRadius: 3,
                            "&:hover": { background: "#b71c1c" }
                        }}
                    >
                        <CallEnd />
                    </IconButton>

                </Tooltip>

            </Box>

        </Box>
    );
}

export default VideoMeetComponent;