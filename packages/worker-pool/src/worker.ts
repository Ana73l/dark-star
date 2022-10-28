addEventListener('message', (event: any) => {
	const response: { id?: number; result?: any; error?: any } = {
		id: undefined,
		result: undefined,
		error: undefined,
	};

	try {
		const { data } = event;
		const { id, task, params } = data;
		response.id = id;
		response.result = eval('(' + task + ')')(params);
	} catch (err) {
		response.error = err;
	} finally {
		postMessage(response);
	}
});
