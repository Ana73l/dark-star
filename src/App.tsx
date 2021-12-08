import { useRef, useEffect } from 'react';
import './App.css';

import { bootstrap } from './sim/bootstrap';

const App = () => {
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const resize = () => {
            if (!canvas.current) {
                return;
            }

            (async () => {
                await bootstrap(canvas.current as HTMLCanvasElement);
            })();

            canvas.current.width = window.innerWidth;
            canvas.current.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);

        return () => window.removeEventListener('resize', resize);
    }, [canvas]);

    return <canvas ref={canvas} />;
};

export default App;
