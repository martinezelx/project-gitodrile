#![allow(linker_messages)]

use std::path::Path;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

fn git_command(repo_path: &str) -> Command {
    let mut command = Command::new("git");
    command.arg("-C").arg(repo_path);
    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);
    command
}

#[derive(serde::Serialize)]
struct RepositoryInfo {
    name: String,
    path: String,
    branch: String,
}

#[tauri::command]
fn app_status() -> &'static str {
    "GitOdrile is ready"
}

#[tauri::command]
fn open_repository(path: String) -> Result<RepositoryInfo, String> {
    let repo_path = Path::new(&path);
    if !repo_path.is_dir() {
        return Err("That folder doesn't exist.".to_string());
    }

    let is_repo = git_command(&path)
        .args(["rev-parse", "--is-inside-work-tree"])
        .output()
        .map_err(|_| {
            "Couldn't run git. Make sure Git is installed and on your PATH.".to_string()
        })?;

    if !is_repo.status.success() {
        return Err("This folder isn't a Git repository.".to_string());
    }

    let branch_output = git_command(&path)
        .args(["branch", "--show-current"])
        .output()
        .map_err(|_| "Couldn't read the current branch.".to_string())?;

    let branch = String::from_utf8_lossy(&branch_output.stdout)
        .trim()
        .to_string();
    let branch = if branch.is_empty() {
        "detached HEAD".to_string()
    } else {
        branch
    };

    let name = repo_path
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    Ok(RepositoryInfo { name, path, branch })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![app_status, open_repository])
        .run(tauri::generate_context!())
        .expect("error while running GitOdrile");
}
