use std::process::ExitCode;

fn main() -> ExitCode {
    if let Err(e) = kinic_cli::run() {
        eprintln!("{e:?}");
        return ExitCode::from(1);
    }
    ExitCode::SUCCESS
}
