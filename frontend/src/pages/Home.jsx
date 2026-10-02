import  { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Container
} from "@mui/material";

import { useNavigate } from "react-router-dom";

function Home() {

    const [meetingCode, setMeetingCode] = useState("");
    const navigate = useNavigate();

    const joinMeeting = () => {

        if (meetingCode.trim() === "") {
            alert("Please enter meeting code");
            return;
        }

        navigate(`/${meetingCode}`);
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column"
            }}
        >

            {/* Header */}

            <Box
                sx={{
                    px: {
                        xs: 3,
                        md: 5
                    },
                    py: 2
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: "#111111"
                    }}
                >
                    Apna Video Call
                </Typography>
            </Box>


            {/* Main Section */}

            <Container
                maxWidth="lg"
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center"
                }}
            >

                <Box
                    sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",

                        flexDirection: {
                            xs: "column-reverse",
                            md: "row"
                        },

                        gap: {
                            xs: 5,
                            md: 2
                        }
                    }}
                >

                    {/* LEFT CONTENT */}

                    <Box
                        sx={{
                            width: {
                                xs: "100%",
                                md: "50%"
                            },

                            textAlign: {
                                xs: "center",
                                md: "left"
                            }
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize: {
                                    xs: "26px",
                                    md: "32px"
                                },
                                fontWeight: 700,
                                color: "#111111",
                                mb: 2
                            }}
                        >
                            Providing Quality Video Call
                            <br />

                            <span>
                                Just Like Quality Education
                            </span>
                        </Typography>


                        {/* Meeting Input */}

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1.5,

                                justifyContent: {
                                    xs: "center",
                                    md: "flex-start"
                                },

                                mt: 2
                            }}
                        >

                            <TextField
                                placeholder="Meeting Code"
                                value={meetingCode}
                                onChange={(e) =>
                                    setMeetingCode(e.target.value)
                                }
                                size="small"
                                sx={{
                                    width: "225px",

                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "4px"
                                    }
                                }}
                            />


                            <Button
                                variant="contained"
                                onClick={joinMeeting}
                                sx={{
                                    backgroundColor: "#1976d2",
                                    px: 3,
                                    fontWeight: 600,

                                    "&:hover": {
                                        backgroundColor: "#1565c0"
                                    }
                                }}
                            >
                                JOIN
                            </Button>

                        </Box>

                    </Box>


                    {/* RIGHT IMAGE */}

                    <Box
                        sx={{
                            width: {
                                xs: "90%",
                                md: "45%"
                            },

                            display: "flex",
                            justifyContent: "center"
                        }}
                    >

                        <Box
                            component="img"
                            src="/video-call.png"
                            alt="Video Call"
                            sx={{
                                width: "100%",
                                maxWidth: "520px",
                                height: "auto",
                                objectFit: "contain"
                            }}
                        />

                    </Box>

                </Box>

            </Container>

        </Box>
    );
}

export default Home;