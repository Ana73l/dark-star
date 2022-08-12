import { int32 } from '@dark-star/schema';
import { component, tag } from '../src/component';

describe('component', () => {
	describe('tag', () => {
		it('Tags can be only empty schemas', () => {
			class TestTagA {
				@int32() x: number = 0;
			}

			class TestTag {}

			expect(() => {
				tag()(TestTag);
			}).not.toThrow();
			expect(() => {
				tag()(TestTagA);
			}).toThrow(`Cannot mark not empty class as tag ${TestTagA.name}`);
		});
	});
});
