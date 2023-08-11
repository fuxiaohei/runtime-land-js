use anyhow::Result;
use quickjs_wasm_rs::{JSContextRef, JSValue, JSValueRef};
use std::io::Write;

fn console_log_to<T>(
    mut stream: T,
) -> impl FnMut(&JSContextRef, JSValueRef, &[JSValueRef]) -> Result<JSValue>
where
    T: Write + 'static,
{
    move |_ctx: &JSContextRef, _this: JSValueRef, args: &[JSValueRef]| {
        // Write full string to in-memory destination before writing to stream since each write call to the stream
        // will invoke a hostcall.
        let mut log_line = String::new();
        for (i, arg) in args.iter().enumerate() {
            if i != 0 {
                log_line.push(' ');
            }
            let line = arg.as_str_lossy();
            log_line.push_str(&line);
        }
        writeln!(stream, "{log_line}")?;
        Ok(JSValue::Undefined)
    }
}

/// register registers console.log and console.error to the given context.
pub fn register<T, U>(context: &JSContextRef, log_stream: T, error_stream: U) -> Result<()>
where
    T: Write + 'static,
    U: Write + 'static,
{
    let console_log_callback = context.wrap_callback(console_log_to(log_stream))?;
    let console_error_callback = context.wrap_callback(console_log_to(error_stream))?;
    let console_object = context.object_value()?;
    console_object.set_property("log", console_log_callback)?;
    console_object.set_property("error", console_error_callback)?;
    context
        .global_object()?
        .set_property("console", console_object)?;
    Ok(())
}
