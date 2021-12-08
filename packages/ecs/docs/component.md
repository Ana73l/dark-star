# Component

Components are classes that represent plain data structures

```ts
@component
class Position {
    x: number = 0;
    y: number = 0;
    z: number = 0;
}

@component
class Health {
    maxHealth: number = 100;
    currentHealth: number = 50;
}
```

Components can also be used as flags with no data

```ts
@component
class Alive {}
```

## Defining Components

Components are defined as classes with constructors that accept no arguments, decorated with the @Component decorator

```ts
@component
class Rotation {
    x: number = 0;
    y: number = 0;
    z: number = 0;
}
```
