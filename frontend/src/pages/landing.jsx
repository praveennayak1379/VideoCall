
import "./landing.css";
import { Link } from "react-router-dom";

function LandingPage() {
    return (
        <div className="landingPageContainer">

            {/* NAVBAR */}
            <nav>
                <div className="navHeader">
                    <h2>Alpha Video Call</h2>
                </div>

                <div className="navlist">
                    <p>Join as Guest</p>
                    <p>Register</p>
                    <p>Login</p>
                </div>
            </nav>

            {/* MAIN HERO SECTION */}
            <div className="landingMainContainer">

                {/* LEFT SIDE - CONTENT */}
                <div className="heroContent">
                    <h1>
                        <span>Connect</span> with your loved ones
                    </h1>

                    <p>Cover a distance by Apna video call</p>

                    <div className="getStarted">
                        <Link to="/auth">Get Started</Link>
                    </div>
                </div>

                {/* RIGHT SIDE - IMAGES */}
                <div className="phoneContainer">

                    <div className="phoneCard phoneBack">
                        <img src="/photo1.jpg" alt="Video call preview 1" />
                    </div>

                    <div className="phoneCard phoneFront">
                        <img src="/photo2.jpg" alt="Video call preview 2" />
                        <h2>Praveen</h2>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default LandingPage;
