import { useRef, useEffect } from 'react';

import { bootstrap } from '../lib/bootstrap';

const App = () => {
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvas.current) {
			return;
		}

		(async () => {
			await bootstrap(canvas.current!);
		})();
	}, []);

	return <canvas ref={canvas} />;
};

export default App;
