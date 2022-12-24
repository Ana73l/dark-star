enum KeyPressEvents {
	PRESS = 'keydown',
	RELEASE = 'keyup'
}

export enum Keys {
	ESCAPE = 'Escape',
	SHIFT_LEFT = 'ShiftLeft',
	SHIFT_RIGHT = 'ShiftRight',
	CAPS = 'CapsLock',
	ALT_LEFT = 'AltLeft',
	ALT_RIGHT = 'AltRight',
	ENTER = 'Enter',
	BACKSPACE = 'Backspace',
	F1 = 'F1',
	F2 = 'F2',
	F3 = 'F3',
	F4 = 'F4',
	F5 = 'F5',
	F6 = 'F6',
	F7 = 'F7',
	F8 = 'F8',
	F9 = 'F9',
	F10 = 'F10',
	F11 = 'F11',
	F12 = 'F12',
	DELETE = 'Delete',
	/* Numpad */
	NUM0 = 'Numpad0',
	NUM1 = 'Numpad1',
	NUM2 = 'Numpad2',
	NUM3 = 'Numpad3',
	NUM4 = 'Numpad4',
	NUM5 = 'Numpad5',
	NUM6 = 'Numpad6',
	NUM7 = 'Numpad7',
	NUM8 = 'Numpad8',
	NUM9 = 'Numpad9',
	/* Arrows */
	UP = 'ArrowUp',
	DOWN = 'ArrowDown',
	LEFT = 'ArrowLeft',
	RIGHT = 'ArrowRight',
	SPACE = 'Space',
	/* Alphaber */
	Q = 'KeyQ',
	W = 'KeyW',
	E = 'KeyE',
	R = 'KeyR',
	T = 'KeyT',
	Y = 'KeyY',
	U = 'KeyU',
	I = 'KeyI',
	O = 'KeyO',
	P = 'KeyP',
	A = 'KeyA',
	S = 'KeyS',
	D = 'KeyD',
	F = 'KeyF',
	G = 'KeyG',
	H = 'KeyH',
	J = 'KeyJ',
	K = 'KeyK',
	L = 'KeyL',
	Z = 'KeyZ',
	X = 'KeyX',
	C = 'KeyC',
	V = 'KeyV',
	B = 'KeyB',
	N = 'KeyN',
	M = 'KeyM',
	/* Digits */
	ZERO = 'Digit0',
	ONE = 'Digit1',
	TWO = 'Digit2',
	THREE = 'Digit3',
	FOUR = 'Digit4',
	FIVE = 'Digit5',
	SIX = 'Digit6',
	SEVEN = 'Digit7',
	EIGHT = 'Digit8',
	NINE = 'Digit9'
}

export class Keyboard {
	private keys: Map<Keys, boolean | undefined> = new Map();
	private parent?: HTMLElement;

	public pressed(key: Keys): boolean {
		return this.keys.get(key) || false;
	}

	public attach(parent: HTMLElement): Keyboard {
		if (this.parent) {
			this.detach();
		}

		this.parent = parent;
		parent.addEventListener(KeyPressEvents.PRESS, this.press);
		parent.addEventListener(KeyPressEvents.RELEASE, this.release);
		console.log('attached keyboard');
		return this;
	}

	public detach(): Keyboard {
		if (this.parent) {
			this.parent.removeEventListener(KeyPressEvents.PRESS, this.press);
			this.parent.removeEventListener(KeyPressEvents.RELEASE, this.release);
			this.parent = undefined;
			this.keys.clear();
		}

		return this;
	}

	private press = ({ code }: KeyboardEvent) => {
		this.keys.set(code as Keys, true);
	};

	private release = ({ code }: KeyboardEvent) => {
		this.keys.set(code as Keys, false);
	};
}
