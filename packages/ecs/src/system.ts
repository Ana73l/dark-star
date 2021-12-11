export type SystemType<T extends System = System> = { new (...args: any): T };

export interface System {
    tickRate?: number;
    ticksSinceLastExecution?: number;

    execute(deltaT?: number): void;
}

export const system = <T extends SystemType>(target: T): T => {
    if (!target.prototype.tickRate) {
        target.prototype.tickRate = 1;
    }

    if (!target.prototype.ticksSinceLastExecution) {
        target.prototype.ticksSinceLastExecution = 1;
    }

    return target;
};

export const registerSystem = <T extends System>(systems: System[], system: T): void => {
    if (systems.find((sys) => sys.constructor === system.constructor)) {
        return;
    }

    systems.push(system);
};

export const removeSystem = <T extends SystemType>(systems: System[], systemType: T): void => {
    const sysIndex = systems.findIndex((sys) => sys.constructor === systemType);

    if (sysIndex === -1) {
        return;
    }

    systems.splice(sysIndex, 1);
};

export const executeSystems = (systems: System[], deltaT: number): void => {
    const sysCount = systems.length;
    let sysIndex;
    let currSystem;

    for (sysIndex = 0; sysIndex < sysCount; sysIndex++) {
        currSystem = systems[sysIndex];

        if (currSystem.ticksSinceLastExecution === currSystem.tickRate) {
            currSystem.execute(deltaT);
            currSystem.ticksSinceLastExecution = 1;
        } else {
            (currSystem.ticksSinceLastExecution as number)++;
        }
    }
};
