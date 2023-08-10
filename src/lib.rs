use anyhow::Result;
use http::{HeaderName, HeaderValue, StatusCode};
use once_cell::sync::OnceCell;
use quickjs_wasm_rs::{Deserializer, JSContextRef, JSValue, JSValueRef, Serializer};
use send_wrapper::SendWrapper;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::ops::Deref;
use std::{io::Read, time::Instant};

// JS_VENDOR is a global JS code to run.
static JS_VENDOR: &str = include_str!("../js-lib/dist/lib.js");
// JS_MOCK_CALLER is a global JS code to run.
static JS_MOCK_CALLER: &str = include_str!("../js-mock-caller.js");
// JS_RUNTIME is a global runtime to run JS code.
static JS_RUNTIME: OnceCell<SendWrapper<Runtime>> = OnceCell::new();
// JS_GLOBAL is a global object to run JS code.
static JS_GLOBAL: OnceCell<SendWrapper<JSValueRef>> = OnceCell::new();
// JS_HANDLER is a global function to handle JS code.
static JS_HANDLER: OnceCell<SendWrapper<JSValueRef>> = OnceCell::new();

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

pub fn console_log(
    _context: &JSContextRef,
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
        print!("{}", arg.as_str_lossy());
    }
    println!();
    Ok(JSValue::Undefined)
}

mod hostcall;

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

    // add hostcall
    let hostcall = context.object_value()?;
    hostcall.set_property("read_body", context.wrap_callback(hostcall::read_body)?)?;
    global.set_property("hostcall", hostcall)?;

    // load vendor
    let _ = context.eval_global("vendor.js", JS_VENDOR)?;
    // load source
    let _ = context.eval_module("user.js", &script)?;
    // convert source module to global
    let _ = context.eval_module(
        "run.js",
        "import fn from 'user.js'; globalThis.handler = fn;",
    )?;

    // if MOCK=true in env, eval js-mock-caller once
    if std::env::var("MOCK").is_ok() {
        let _ = context.eval_global("js-mock-caller.js", JS_MOCK_CALLER)?;
    }

    // wait for pending jobs
    context.execute_pending()?;

    JS_GLOBAL.set(SendWrapper::new(global)).unwrap();

    // get handler
    let handler = global.get_property("callHandler")?;
    JS_HANDLER.set(SendWrapper::new(handler)).unwrap();

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
    body_handle: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JsResponse {
    status: u16,
    #[serde(default)]
    headers: HashMap<String, String>,
}

use land_sdk::http::{error_response, Body, Request, Response};
use land_sdk::http_main;

#[http_main]
pub fn handle_request(req: Request) -> Response {
    match handle_js_request(req) {
        Ok(response) => response,
        Err(err) => {
            println!("handle_js_request error: {:?}", err);
            http::Response::builder()
                .status(500)
                .body(Body::from(err.to_string()))
                .unwrap()
        }
    }
}

fn handle_js_request(req: Request) -> Result<Response> {
    // create input JsRequest
    let mut headers = HashMap::new();
    req.headers().iter().for_each(|(key, value)| {
        headers.insert(
            key.as_str().to_string(),
            value.to_str().unwrap().to_string(),
        );
    });
    let request = JsRequest {
        id: 1,
        method: req.method().to_string(),
        uri: req.uri().clone().to_string(),
        headers,
        body_handle: req.body().body_handle(),
    };

    let context = JS_RUNTIME.get().unwrap().context();
    let mut serializer = Serializer::from_context(context)?;
    request.serialize(&mut serializer)?;
    let request_value = serializer.value;

    let global = JS_GLOBAL.get().expect("js global not initialized");
    let handler = JS_HANDLER.get().expect("js handler not initialized");

    // call global fetch handler with request object
    match handler.call(global, &[request_value]) {
        Ok(_) => {
            let mut response: JSValueRef<'_>;
            loop {
                println!("execute pending");
                context.execute_pending()?;
                let global = context.global_object()?;
                response = global
                    .get_property("globalResponse")
                    .expect("get globalResponse failed");
                if response.is_undefined() || response.is_null() {
                    continue;
                }
                break;
            }

            let deserializer = &mut Deserializer::from(response);
            let response =
                JsResponse::deserialize(deserializer).expect("deserialize response failed");

            let mut builder = http::Response::builder().status(response.status);
            if let Some(headers) = builder.headers_mut() {
                for (key, value) in &response.headers {
                    headers.insert(
                        HeaderName::try_from(key.deref())?,
                        HeaderValue::from_bytes(value.as_bytes())?,
                    );
                }
            }

            Ok(builder.body(Body::from("Hello js sdk")).unwrap())
        }
        Err(err) => {
            println!("callHandler error: {:?}", err);
            Ok(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                err.to_string(),
            ))
        }
    }
}
