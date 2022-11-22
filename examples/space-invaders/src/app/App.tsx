import { useRef, useEffect } from 'react';

import { bootstrap } from '../lib/bootstrap';

const App = () => {
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if(!canvas.current) {
			return;
		}

		const resize = () => {
			if (!canvas.current) {
				return;
			}

			canvas.current.width = window.innerWidth;
			canvas.current.height = window.innerHeight;
		};

		resize();

		(async () => {
			await bootstrap(canvas.current!);
		})();

		window.addEventListener('resize', resize);

		return () => window.removeEventListener('resize', resize);
	}, []);

	return <canvas ref={canvas} />;
};

export default App;
