export const normalizePath = (path: string, stripTrailing: boolean = false) => {
	if (path === '\\' || path == '/') {
		return '/';
	}

	const { length } = path;

	if (length <= 1) {
		return path;
	}

	let prefix: string = '';

	if (length > 4 && path[3] === '\\') {
		const ch = path[2];
		if ((ch === '?' || ch === '.') && path.slice(0, 2) === '\\\\') {
			path = path.slice(2);
			prefix = '//';
		}
	}

	const segments = path.split(/[/\\]+/);

	if (stripTrailing && segments[segments.length - 1] === '') {
		segments.pop();
	}

	return prefix + segments.join('/');
};
