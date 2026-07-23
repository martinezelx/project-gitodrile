#![allow(linker_messages)]

use std::io::ErrorKind;
use std::path::Path;
use std::process::{Command, Output};

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

fn run_git(repo_path: &str, args: &[&str]) -> Result<Output, String> {
    git_command(repo_path).args(args).output().map_err(|error| {
        if error.kind() == ErrorKind::NotFound {
            "Git isn't installed, or isn't on your PATH. Install Git and try again.".to_string()
        } else {
            "Couldn't run git.".to_string()
        }
    })
}

fn git_stdout(output: &Output) -> String {
    String::from_utf8_lossy(&output.stdout).trim().to_string()
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct RepositoryInfo {
    name: String,
    path: String,
    branch: String,
    kind: RepositoryKind,
    status_message: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "lowercase")]
enum RepositoryKind {
    Repository,
    Worktree,
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

    let is_repo = run_git(&path, &["rev-parse", "--is-inside-work-tree"])?;
    if !is_repo.status.success() {
        return Err("This folder isn't a Git repository.".to_string());
    }

    // A linked worktree's --git-dir (e.g. .git/worktrees/<name>) differs from
    // the --git-common-dir shared with the main checkout; a normal repository's
    // are the same path. This is the same check `git` itself relies on.
    let git_dir = git_stdout(&run_git(&path, &["rev-parse", "--git-dir"])?);
    let common_dir = git_stdout(&run_git(&path, &["rev-parse", "--git-common-dir"])?);
    let kind = if git_dir == common_dir {
        RepositoryKind::Repository
    } else {
        RepositoryKind::Worktree
    };

    let branch = git_stdout(&run_git(&path, &["branch", "--show-current"])?);
    let branch = if branch.is_empty() {
        "detached HEAD".to_string()
    } else {
        branch
    };

    let name = repo_path
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    let status_message = match kind {
        RepositoryKind::Repository => format!("This is a Git repository on branch {branch}."),
        RepositoryKind::Worktree => format!("This is a linked worktree on branch {branch}."),
    };

    Ok(RepositoryInfo {
        name,
        path,
        branch,
        kind,
        status_message,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![app_status, open_repository])
        .run(tauri::generate_context!())
        .expect("error while running GitOdrile");
}
