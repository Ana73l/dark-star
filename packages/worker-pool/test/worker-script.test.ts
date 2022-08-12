import { WORKER_SCRIPT } from '../src/worker-script';

describe('worker-script', () => {
	it('Should seed task handling in the created worker scope', () => {
		const expected = `(function main() {
    addEventListener('message', (event) => {
        const response = {
            id: undefined,
            result: undefined,
            error: undefined,
        };
        try {
            const { data } = event;
            const { id, task, params } = data;
            response.id = id;
            response.result = eval('(' + task + ')')(params);
        }
        catch (err) {
            response.error = err;
        }
        finally {
            postMessage(response);
        }
    });
})()`;

		expect(WORKER_SCRIPT).toEqual(expected);
	});
});
