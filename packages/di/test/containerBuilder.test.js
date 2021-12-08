var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import 'reflect-metadata';
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { injectable } from '../src/decorators/injectable';
class IA {
}
let A = class A {
    constructor() {
        this.aProp = 1;
    }
};
A = __decorate([
    injectable
], A);
let B = class B {
    constructor(_a) {
        this._a = _a;
        this.bProp = 2;
    }
    get a() {
        return this._a;
    }
};
B = __decorate([
    injectable
], B);
let C = class C {
    constructor(_b) {
        this._b = _b;
        this.cProp = 3;
    }
    get b() {
        return this._b;
    }
};
C = __decorate([
    injectable
], C);
describe('ContainerBuilder', () => {
    describe('registerSingleton', () => {
        let builder;
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
            expect(container.get(A)).to.be.equal(container.get(B).a);
            expect(container.get(A)).to.be.equal(container.get(C).b.a);
            expect(container.get(B)).to.be.equal(container.get(C).b);
            expect(container.get(B).a).to.be.equal(container.get(C).b.a);
        });
    });
    describe('registerTransient', () => {
        let builder;
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
            expect(container.get(A)).to.not.be.equal(container.get(B).a);
            expect(container.get(A)).to.not.be.equal(container.get(C).b.a);
            expect(container.get(B)).to.not.be.equal(container.get(C).b);
            expect(container.get(B).a).to.not.be.equal(container.get(C).b.a);
        });
    });
});
//# sourceMappingURL=containerBuilder.test.js.map