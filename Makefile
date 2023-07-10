.PHONY: release, build, js, test

js:
	cd js-lib && npx rspack build --mode=production

build: js
	cargo build --target wasm32-wasi
	cp ./target/wasm32-wasi/debug/land_js.wasm ./land_js.wasm

release: js
	cargo build --target wasm32-wasi --release
	cp ./target/wasm32-wasi/release/land_js.wasm ./land_js.wasm
	wasm-opt --strip-debug -o land_js.wasm land_js.wasm

test: release
	cat tests.js | wizer land_js.wasm -o land_js.wizer.wasm --allow-wasi --inherit-stdio=true --inherit-env=true --wasm-bulk-memory=true