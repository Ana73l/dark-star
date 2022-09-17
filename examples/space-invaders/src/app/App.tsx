import { useRef, useEffect } from 'react';
import './App.css';

import { bootstrap } from '../lib/bootstrap';

const App = () => {
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const resize = () => {
			if (!canvas.current) {
				return;
			}

			canvas.current.width = window.innerWidth;
			canvas.current.height = window.innerHeight;
		};

		resize();

		(async () => {
			await bootstrap(canvas.current as HTMLCanvasElement);
		})();

		window.addEventListener('resize', resize);

		return () => window.removeEventListener('resize', resize);
	}, [canvas]);

	return <canvas ref={canvas} style={{ imageRendering: 'pixelated' }} />;
};

export default App;
