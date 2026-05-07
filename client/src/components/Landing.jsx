import './Landing.css'

export default function LandingPage(){
    async function handleLogin() {
        const popup = window.open("https://www.mymru.ca/",'_blank',"width=500,height=600");
        const interval = setInterval(() => {
            try {
                const URL = popup.location.href

                if (URL == "https://www.mymru.ca/") {
                    clearInterval(interval);
                }
            } catch (err) { 
                console.log(err.message);
            }
        }, 1000)
    }

    return (
        <>
        <div className="page-login">
            <h2>Please login to use this app</h2>
            <button 
            className='login-btn'
            onClick={handleLogin}
            >LogIn</button>
        </div>
     
        </>
    )
}