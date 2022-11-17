/**
 * Worker base allowing handling of tasks.
 * Call this in your worker script if using worker file.
 * If worker is passed as string this will automatically be appended to the worker script.
 */
export function main() {
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
}

export const WORKER_SCRIPT = `(${main.toString()})()`;
