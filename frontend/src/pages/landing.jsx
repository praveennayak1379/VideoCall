import "./landing.css";
import {Link} from "react-router-dom";
function LandingPage()
{
    return(
        <div className="landingPageContainer">
            <nav>
                <div className="navHeader">
                    <h2>Alpha Video Call</h2>
                </div>
                <div className="navlist">
                    <p>Join as Guest</p>
                    <p>Register</p>
                    <div role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1><span style={{color:"#FF9839"}}>Connect</span> with your loved ones</h1>
                    <p>Cover a distance by Apna video call </p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>

                </div>
                <div className="phoneContainer">
                    <img src="/photo1.jpg" className="phone phoneBack" alt="Video call"/>
                    <img src="/photo2.jpg" className="phone phoneFront" alt="Video call" />
                </div>

            </div>
        </div>

    )
}
export default LandingPage;