import 'reflect-metadata';
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';

import { ContainerBuilder } from '../src/containerBuilder';
import { injectable } from '../src/decorators/injectable';

abstract class IA {
    aProp: number;
}

@injectable
class A implements IA {
    aProp: number = 1;
}

@injectable
class B {
    bProp: number = 2;

    constructor(private _a: A) {}

    get a() {
        return this._a;
    }
}

@injectable
class C {
    cProp: number = 3;

    constructor(private _b: B) {}

    get b() {
        return this._b;
    }
}

describe('ContainerBuilder', () => {
    describe('registerSingleton', () => {
        let builder: ContainerBuilder;

        beforeEach(() => {
            builder = new ContainerBuilder();
        });

        it('Should accept one parameter - solid class that will serve as identifier and constructor', () => {
            const container = builder.registerSingleton(A).build();

            expect(container.get(A) instanceof A).to.be.true;
        });

        it(`Should accept two parameters:
            @{param} identifier - abstract/ solid class that will serve as identifier
            @{param} constructor - solid class that implements that identifier
            `, () => {
            const container = builder.registerSingleton(IA, A).build();

            expect(container.get(IA) instanceof A).to.be.true;
            expect(container.get(IA) instanceof IA).to.be.false;
        });

        it(`Should accept two parameters:
            @{param} identifier - abstract/ solid class that will serve as identifier
            @{param} factory - factory function that will return an object, implementing the identifier
            `, () => {
            const container = builder.registerSingleton(IA, () => ({ aProp: 1 })).build();

            expect(container.get(IA).aProp).not.to.be.undefined;
            expect(container.get(IA).aProp).to.be.equal(1);
        });

        it(`Should accept two parameters:
            @{param} identifier - abstract/ solid class that will serve as identifier
            @{param} instance - object that implements the identifier
            `, () => {
            const container = builder.registerSingleton(IA, { aProp: 1 }).build();

            expect(container.get(IA).aProp).not.to.be.undefined;
            expect(container.get(IA).aProp).to.be.equal(1);
        });

        it('Should inject the same instance of the dependency in each injectable depending on it', () => {
            const container = builder.registerSingleton(A).registerSingleton(B).registerSingleton(C).build();

            expect(container.get(A)).to.be.equal(container.get(A));
            expect(container.get(A)).to.be.equal(container.get<B>(B).a);
            expect(container.get(A)).to.be.equal(container.get<C>(C).b.a);
            expect(container.get(B)).to.be.equal(container.get<C>(C).b);
            expect(container.get<B>(B).a).to.be.equal(container.get<C>(C).b.a);
        });
    });

    describe('registerTransient', () => {
        let builder: ContainerBuilder;

        beforeEach(() => {
            builder = new ContainerBuilder();
        });

        it('Should accept one parameter - solid class that will serve as identifier and constructor', () => {
            const container = builder.registerTransient(A).build();

            expect(container.get(A) instanceof A).to.be.true;
        });

        it(`Should accept two parameters:
            @{param} identifier - abstract/ solid class that will serve as identifier
            @{param} constructor - solid class that implements that identifier
            `, () => {
            const container = builder.registerTransient(IA, A).build();

            expect(container.get(IA) instanceof A).to.be.true;
            expect(container.get(IA) instanceof IA).to.be.false;
        });

        it(`Should accept two parameters:
            @{param} identifier - abstract/ solid class that will serve as identifier
            @{param} factory - factory function that will return an object, implementing the identifier
            `, () => {
            const container = builder.registerTransient(IA, () => ({ aProp: 1 })).build();

            expect(container.get(IA).aProp).not.to.be.undefined;
            expect(container.get(IA).aProp).to.be.equal(1);
        });

        it('Should inject a new instance of the dependency in each injectable depending on it', () => {
            const container = builder.registerTransient(A).registerTransient(B).registerTransient(C).build();

            expect(container.get(A)).to.not.be.equal(container.get(A));
            expect(container.get(A)).to.not.be.equal(container.get<B>(B).a);
            expect(container.get(A)).to.not.be.equal(container.get<C>(C).b.a);
            expect(container.get(B)).to.not.be.equal(container.get<C>(C).b);
            expect(container.get<B>(B).a).to.not.be.equal(container.get<C>(C).b.a);
        });
    });
});
