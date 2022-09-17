import { read, write, ComponentAccessFlags } from '../src/query';

describe('query', () => {
	class A {}

	describe('read', () => {
		it('Marks a class constructor as Readonly', () => expect(read(A).flag).toEqual(ComponentAccessFlags.Read));
	});

	describe('write', () => {
		it('Marks a class constructor as Writeable', () => expect(write(A).flag).toEqual(ComponentAccessFlags.Write));
	});
});
