import './Overlay.css'

export default function Overlay({showOverlay, message, error, onClose}) {
    if (showOverlay === true) {
        return (
          <>
            <div className="overlay">
              <div className="overlayCard">
                <button type='button' className="closeBtn" onClick={() => { console.log('close clicked'); onClose(); }}>
                  x
                </button>
                {message && <p className="overlayMessage">{message}</p>}

                {error && (
                  <div className="overlay-error">
                    <p className="overlay-error-title">{error.message}</p>
                    <pre className="overlay-error-stack">{error.stack}</pre>
                  </div>
                )}
              </div>
            </div>
          </>
        );
    }
}