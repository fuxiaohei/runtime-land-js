use anyhow::Result;
use once_cell::sync::OnceCell;
use quickjs_wasm_rs::{JSContextRef, JSValue, JSValueRef};
use send_wrapper::SendWrapper;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::{io::Read, time::Instant};

// JS_VENDOR is a global JS code to run.
static JS_VENDOR: &str = include_str!("../js-lib/dist/lib.js");
// JS_RUNTIME is a global runtime to run JS code.
static JS_RUNTIME: OnceCell<SendWrapper<Runtime>> = OnceCell::new();
// JS_GLOBAL is a global object to run JS code.
static JS_GLOBAL: OnceCell<SendWrapper<JSValueRef>> = OnceCell::new();

#[derive(Debug)]
pub struct Runtime {
    context: JSContextRef,
}

impl Runtime {
    pub fn new() -> Result<Self> {
        let context = JSContextRef::default();
        Ok(Self { context })
    }
    pub fn context(&self) -> &JSContextRef {
        &self.context
    }
}

pub fn console_log<'a>(
    _context: &'a JSContextRef,
    _this: JSValueRef,
    args: &[JSValueRef],
) -> Result<JSValue> {
    let mut spaced = false;
    for arg in args {
        if spaced {
            print!(" ");
        } else {
            spaced = true;
        }
        print!("{}", arg.to_string());
    }
    println!();
    Ok(JSValue::Undefined)
}

fn init_js_context() -> Result<()> {
    let st = Instant::now();
    let mut script = String::new();
    std::io::stdin().read_to_string(&mut script)?;

    // make runtime live forever
    let runtime = Runtime::new()?;
    JS_RUNTIME.set(SendWrapper::new(runtime)).unwrap();

    let runtime = JS_RUNTIME.get().unwrap();
    let context = runtime.context();
    // get global object in context
    let global = context.global_object()?;

    // add console.log()
    let console = context.object_value()?;
    console.set_property("log", context.wrap_callback(console_log)?)?;
    global.set_property("console", console)?;

    // load vendor
    let _ = context.eval_global("vendor.js", JS_VENDOR)?;
    // load source
    let _ = context.eval_module("index.js", &script)?;
    // convert source module to global
    let _ = context.eval_module(
        "run.js",
        "import fn from 'index.js'; globalThis.handler = fn;",
    )?;

    // wait for pending jobs
    context.execute_pending()?;

    JS_GLOBAL.set(SendWrapper::new(global)).unwrap();

    println!("init js context: {:?}", st.elapsed());

    Ok(())
}

#[export_name = "wizer.initialize"]
pub extern "C" fn init() {
    init_js_context().unwrap();
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JsRequest {
    id: u64,
    method: String,
    uri: String,
    #[serde(default)]
    headers: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JsResponse {
    status: u16,
    #[serde(default)]
    headers: HashMap<String, String>,
}

use land_sdk::http::{Body, Request, Response};
use land_sdk::http_main;

#[http_main]
pub fn handle_request(req: Request) -> Response {
    http::Response::builder()
        .body(Body::from("Hello Moni JS SDK!!"))
        .unwrap()
}
